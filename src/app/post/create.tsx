import { Image } from 'expo-image';
import { router } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { SymbolView } from 'expo-symbols';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { useLocale } from '@/hooks/use-locale';
import { useAppTheme } from '@/hooks/use-theme';
import { getFriendlyAuthError } from '@/lib/errors/friendly-message';
import { storage } from '@/lib/firebase/config';
import { useAosell } from '@/providers/aosell-provider';
import type { PostLinkTarget, PostMediaType } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;
type SymbolName = ComponentProps<typeof SymbolView>['name'];

const mediaModes = ['image', 'video', 'text'] as const;

// Keeps uploads (and the device's own memory while picking/uploading) small:
// a feed post never needs a full-resolution camera photo, so images are
// downscaled and re-compressed before upload; videos are requested at a
// lower export quality straight from the picker (iOS only — the picker has
// no video re-encode option on Android, so size there still relies on the
// existing 150MB Storage rule cap).
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESSION_QUALITY = 0.7;

type SelectedMedia = {
  uri: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
  mimeType?: string;
  extension?: string;
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'video/quicktime': 'mov',
  'video/mp4': 'mp4',
  'video/x-m4v': 'm4v',
  'video/3gpp': '3gp',
};

// expo-image-picker returns the asset's real mime type on most devices, but
// falls back to inferring it from the file extension when absent — iOS
// camera-roll videos are almost always .mov/QuickTime, never actually .mp4,
// so that's the safer default over assuming .mp4.
function resolveVideoFormat(asset: ImagePicker.ImagePickerAsset): { mimeType: string; extension: string } {
  if (asset.mimeType) {
    return { mimeType: asset.mimeType, extension: MIME_TO_EXTENSION[asset.mimeType] ?? asset.mimeType.split('/')[1] ?? 'mov' };
  }

  const uriExtension = asset.uri.split('.').pop()?.toLowerCase();
  if (uriExtension && uriExtension.length <= 4) {
    const matchingMimeType = Object.entries(MIME_TO_EXTENSION).find(([, ext]) => ext === uriExtension)?.[0];
    return { mimeType: matchingMimeType ?? `video/${uriExtension}`, extension: uriExtension };
  }

  return { mimeType: 'video/quicktime', extension: 'mov' };
}

// A post can be a pure share (no commercial link at all), linked to the
// poster's own shop, or linked to one of their existing listings. The
// seller profile itself (and its real Firestore id) isn't known until
// `ensureSellerProfile()` resolves in handleSubmit, so "shop" is a plain
// intent here, not a resolved PostLinkTarget yet.
type LinkChoice = { kind: 'share' } | { kind: 'shop' } | { kind: 'listing'; listingId: string };

export default function CreatePostScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, userProfile, currentSellerProfile, listings, ensureSellerProfile, generatePostId, createPost } = useAosell();

  const [mediaMode, setMediaMode] = useState<PostMediaType>('image');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [linkChoice, setLinkChoice] = useState<LinkChoice>({ kind: 'share' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentUser) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.signedOut}>
          <Text style={[styles.signedOutTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
            {t('createPost.signInTitle')}
          </Text>
          <Text style={[styles.signedOutBody, { color: theme.colors.textMuted }]}>{t('createPost.signInDescription')}</Text>
          <AppButton
            label={t('common.signIn')}
            onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', returnTo: '/post/create' } })}
          />
        </View>
      </SafeAreaView>
    );
  }

  const ownedListings = currentSellerProfile ? listings.filter((listing) => listing.sellerId === currentSellerProfile.id) : [];
  const canSubmit = !isSubmitting && (mediaMode === 'text' || Boolean(selectedMedia));
  const avatarInitials = (userProfile?.displayName ?? currentUser.email).slice(0, 2).toUpperCase();

  async function handlePickMedia() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('createPost.errorTitle'), t('createPost.errorDescription'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaMode === 'video' ? ['videos'] : ['images'],
      quality: 0.8,
      videoMaxDuration: 60,
      ...(mediaMode === 'video' && Platform.OS === 'ios'
        ? { videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium }
        : null),
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (mediaMode === 'video') {
      const { mimeType, extension } = resolveVideoFormat(asset);
      setSelectedMedia({
        uri: asset.uri,
        width: asset.width || undefined,
        height: asset.height || undefined,
        durationSeconds: asset.duration ? asset.duration / 1000 : undefined,
        mimeType,
        extension,
      });
      return;
    }

    const shouldResize = (asset.width ?? 0) > MAX_IMAGE_DIMENSION;
    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      shouldResize ? [{ resize: { width: MAX_IMAGE_DIMENSION } }] : [],
      { compress: IMAGE_COMPRESSION_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
    );

    setSelectedMedia({
      uri: manipulated.uri,
      width: manipulated.width,
      height: manipulated.height,
    });
  }

  async function handleSubmit() {
    if (!currentUser) {
      return;
    }

    if (mediaMode !== 'text' && !selectedMedia) {
      setError(t('createPost.invalid'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // Resolve (and lazily create, if needed) the seller profile — needed
      // for the post's sellerId/linkTarget. Media upload itself doesn't
      // depend on this profile existing (storage.rules keys post-media by
      // the uploader's own uid, not the seller profile id).
      const sellerProfile = await ensureSellerProfile();
      if (!sellerProfile) {
        setError(t('createPost.errorDescription'));
        return;
      }

      // Reserved up front (not left to createPost/PostRepository) so a video
      // file can be named after it: the server-side transcoding function
      // parses this id back out of the Storage path to know which post
      // document to update once conversion finishes.
      const postId = generatePostId();

      let mediaUrl: string | undefined;
      let mediaProcessingStatus: 'pending' | undefined;

      if (mediaMode !== 'text' && selectedMedia) {
        const response = await fetch(selectedMedia.uri);
        const blob = await response.blob();
        const extension = mediaMode === 'video' ? (selectedMedia.extension ?? 'mov') : 'jpg';
        const contentType = mediaMode === 'video' ? (selectedMedia.mimeType ?? 'video/quicktime') : 'image/jpeg';
        const storageRef = ref(storage, `post-media/${currentUser.id}/${postId}.${extension}`);
        await uploadBytes(storageRef, blob, { contentType });
        mediaUrl = await getDownloadURL(storageRef);
        // Videos start out as the raw upload and get swapped for a
        // standardized, re-encoded version once the transcoding function
        // (triggered by this very upload) finishes in the background.
        mediaProcessingStatus = mediaMode === 'video' ? 'pending' : undefined;
      }

      const linkTarget: PostLinkTarget | undefined =
        linkChoice.kind === 'shop'
          ? { type: 'seller', sellerId: sellerProfile.id }
          : linkChoice.kind === 'listing'
            ? { type: 'listing', listingId: linkChoice.listingId, sellerId: sellerProfile.id }
            : undefined;

      const result = await createPost(sellerProfile, {
        postId,
        mediaType: mediaMode,
        mediaUrl,
        mediaWidth: selectedMedia?.width,
        mediaHeight: selectedMedia?.height,
        mediaDurationSeconds: selectedMedia?.durationSeconds,
        caption,
        linkTarget,
        mediaProcessingStatus,
      });

      if (result) {
        router.replace('/(tabs)/home');
      }
    } catch (submitError) {
      // TEMPORARY: append the raw Firebase/SDK code so we can see exactly
      // which error publishing hits without a debugger attached. Remove
      // this suffix once the real cause is confirmed.
      const rawCode =
        typeof submitError === 'object' && submitError !== null && 'code' in submitError
          ? String((submitError as { code?: unknown }).code)
          : typeof submitError === 'object' && submitError !== null && 'message' in submitError
            ? String((submitError as { message?: unknown }).message)
            : String(submitError);
      Alert.alert(t('createPost.errorTitle'), `${getFriendlyAuthError(submitError)} [debug: ${rawCode}]`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
        <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
          <Text style={[styles.topBarAction, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>
            {t('common.cancel')}
          </Text>
        </Pressable>
        <Text style={[styles.topBarTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
          {t('createPost.title')}
        </Text>
        <Pressable accessibilityRole="button" disabled={!canSubmit} hitSlop={8} onPress={() => void handleSubmit()}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            <Text
              style={[
                styles.topBarAction,
                styles.topBarSubmit,
                { color: theme.colors.accent, fontFamily: theme.typography.label.fontFamily, opacity: canSubmit ? 1 : 0.4 },
              ]}>
              {t('createPost.submit')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.mediaTypeRow}>
          {mediaModes.map((mode) => {
            const active = mediaMode === mode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  setMediaMode(mode);
                  setSelectedMedia(null);
                }}
                style={[
                  styles.mediaTypePill,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: active ? theme.colors.text : theme.colors.surfaceMuted,
                  },
                ]}>
                <Text
                  style={[
                    styles.mediaTypeLabel,
                    {
                      color: active ? theme.colors.background : theme.colors.textMuted,
                      fontFamily: theme.typography.label.fontFamily,
                    },
                  ]}>
                  {t(`createPost.mediaType${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {mediaMode !== 'text' ? (
          <MediaPicker mediaMode={mediaMode} selectedMedia={selectedMedia} theme={theme} t={t} onPick={() => void handlePickMedia()} onClear={() => setSelectedMedia(null)} />
        ) : null}

        <View style={styles.captionRow}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, overflow: 'hidden' }]}>
            {userProfile?.avatarUrl ? (
              <Image contentFit="cover" source={{ uri: userProfile.avatarUrl }} style={StyleSheet.absoluteFillObject} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{avatarInitials}</Text>
            )}
          </View>
          <TextInput
            multiline
            onChangeText={setCaption}
            placeholder={t('createPost.captionPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.captionInput, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}
            value={caption}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.linkSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
            {t('createPost.linkTargetLabel')}
          </Text>

          <LinkRow
            icon={{ ios: 'square.and.arrow.up', android: 'share', web: 'share' }}
            label={t('createPost.shareOnly')}
            selected={linkChoice.kind === 'share'}
            theme={theme}
            onPress={() => setLinkChoice({ kind: 'share' })}
          />
          <LinkRow
            icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            label={t('createPost.linkToShop')}
            selected={linkChoice.kind === 'shop'}
            theme={theme}
            onPress={() => setLinkChoice({ kind: 'shop' })}
          />
          {ownedListings.map((listing) => (
            <LinkRow
              key={listing.id}
              icon={{ ios: 'tag', android: 'local_offer', web: 'local_offer' }}
              label={listing.title}
              selected={linkChoice.kind === 'listing' && linkChoice.listingId === listing.id}
              theme={theme}
              onPress={() => setLinkChoice({ kind: 'listing', listingId: listing.id })}
            />
          ))}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.errorTint, borderRadius: theme.radii.md }]}>
            <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function MediaPicker({
  mediaMode,
  selectedMedia,
  theme,
  t,
  onPick,
  onClear,
}: {
  mediaMode: PostMediaType;
  selectedMedia: SelectedMedia | null;
  theme: AppTheme;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onPick: () => void;
  onClear: () => void;
}) {
  if (!selectedMedia) {
    return (
      <Pressable
        onPress={onPick}
        style={[styles.mediaSquare, styles.mediaSquareEmpty, { borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
        <View style={[styles.mediaEmptyIcon, { backgroundColor: theme.colors.surfaceMuted }]}>
          <SymbolView
            tintColor={theme.colors.textMuted}
            size={26}
            name={mediaMode === 'video' ? { ios: 'video', android: 'videocam', web: 'videocam' } : { ios: 'photo', android: 'image', web: 'image' }}
          />
        </View>
        <Text style={[styles.mediaEmptyLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily }]}>
          {mediaMode === 'video' ? t('createPost.pickVideo') : t('createPost.pickPhoto')}
        </Text>
      </Pressable>
    );
  }

  if (mediaMode === 'video') {
    return (
      <View style={[styles.mediaSquare, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
        <SymbolView tintColor={theme.colors.text} size={34} name={{ ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' }} />
        {selectedMedia.durationSeconds ? (
          <View style={[styles.durationBadge, { backgroundColor: 'rgba(0,0,0,0.55)' }]}>
            <Text style={styles.durationText}>{Math.round(selectedMedia.durationSeconds)}s</Text>
          </View>
        ) : null}
        <ChangeMediaButton onPress={onClear} theme={theme} />
      </View>
    );
  }

  return (
    <View style={[styles.mediaSquare, { borderRadius: theme.radii.md, overflow: 'hidden' }]}>
      <Image source={{ uri: selectedMedia.uri }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      <ChangeMediaButton onPress={onClear} theme={theme} />
    </View>
  );
}

function ChangeMediaButton({ onPress, theme }: { onPress: () => void; theme: AppTheme }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={10} onPress={onPress} style={styles.changeMediaButton}>
      <SymbolView tintColor={theme.colors.background} size={14} name={{ ios: 'xmark', android: 'close', web: 'close' }} />
    </Pressable>
  );
}

function LinkRow({
  icon,
  label,
  selected,
  theme,
  onPress,
}: {
  icon: SymbolName;
  label: string;
  selected: boolean;
  theme: AppTheme;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.linkRow,
        { borderRadius: theme.radii.md, backgroundColor: selected ? theme.colors.accentTint : 'transparent' },
      ]}>
      <View style={styles.linkRowLeft}>
        <SymbolView tintColor={selected ? theme.colors.text : theme.colors.textMuted} size={19} name={icon} />
        <Text numberOfLines={1} style={[styles.linkRowLabel, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>
          {label}
        </Text>
      </View>
      {selected ? <SymbolView tintColor={theme.colors.text} size={18} name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }} /> : null}
    </Pressable>
  );
}

const MEDIA_SQUARE_SIZE = 180;

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  topBarAction: { fontSize: 15, lineHeight: 20, minWidth: 56 },
  topBarSubmit: { textAlign: 'right', fontWeight: '700' },
  topBarTitle: { fontSize: 16, lineHeight: 22, flex: 1, textAlign: 'center' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48, gap: 20 },
  signedOut: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  signedOutTitle: { fontSize: 20, lineHeight: 26, textAlign: 'center' },
  signedOutBody: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 8 },

  mediaTypeRow: { flexDirection: 'row', gap: 8 },
  mediaTypePill: { paddingHorizontal: 16, paddingVertical: 9 },
  mediaTypeLabel: { fontSize: 13, lineHeight: 17 },

  mediaSquare: {
    width: MEDIA_SQUARE_SIZE,
    height: MEDIA_SQUARE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaSquareEmpty: { borderWidth: 1.5, gap: 10 },
  mediaEmptyIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  mediaEmptyLabel: { fontSize: 13, lineHeight: 17 },
  durationBadge: { position: 'absolute', right: 8, bottom: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  durationText: { color: '#FFFFFF', fontSize: 11, lineHeight: 14, fontVariant: ['tabular-nums'] },
  changeMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  captionRow: { flexDirection: 'row', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, lineHeight: 17 },
  captionInput: { flex: 1, minHeight: 60, fontSize: 15, lineHeight: 21, paddingTop: 8 },

  divider: { height: StyleSheet.hairlineWidth },

  linkSection: { gap: 2 },
  sectionLabel: { textTransform: 'uppercase', marginBottom: 6 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  linkRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  linkRowLabel: { fontSize: 15, lineHeight: 20, flexShrink: 1 },

  errorBox: { padding: 12 },
  errorText: { fontSize: 13, lineHeight: 18 },
});
