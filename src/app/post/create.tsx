import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { useLocale } from '@/hooks/use-locale';
import { useAppTheme } from '@/hooks/use-theme';
import { storage } from '@/lib/firebase/config';
import { canSellerLinkTarget } from '@/lib/posts';
import { useAosell } from '@/providers/aosell-provider';
import type { PostLinkTarget, PostMediaType } from '@/types/domain';

const mediaModes = ['image', 'video', 'text'] as const;

type SelectedMedia = {
  uri: string;
  width?: number;
  height?: number;
  durationSeconds?: number;
};

export default function CreatePostScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentSellerProfile, listings, createPost } = useAosell();

  const [mediaMode, setMediaMode] = useState<PostMediaType>('image');
  const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
  const [caption, setCaption] = useState('');
  const [linkTarget, setLinkTarget] = useState<PostLinkTarget | undefined>();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentSellerProfile) {
    return (
      <AppScreen>
        <EmptyState title={t('createPost.noSellerProfileTitle')} description={t('createPost.noSellerProfileDescription')} />
      </AppScreen>
    );
  }

  const ownedListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);

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
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    setSelectedMedia({
      uri: asset.uri,
      width: asset.width || undefined,
      height: asset.height || undefined,
      durationSeconds: asset.duration ? asset.duration / 1000 : undefined,
    });
  }

  async function handleSubmit() {
    if (!currentSellerProfile) {
      return;
    }

    if (!linkTarget) {
      setError(t('createPost.invalid'));
      return;
    }

    if (mediaMode !== 'text' && !selectedMedia) {
      setError(t('createPost.invalid'));
      return;
    }

    if (!canSellerLinkTarget({ sellerId: currentSellerProfile.id, linkTarget, ownedListings })) {
      setError(t('createPost.invalid'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      let mediaUrl: string | undefined;

      if (mediaMode !== 'text' && selectedMedia) {
        const response = await fetch(selectedMedia.uri);
        const blob = await response.blob();
        const fileName = `${Date.now()}-${mediaMode === 'video' ? 'video.mp4' : 'image.jpg'}`;
        const storageRef = ref(storage, `post-media/${currentSellerProfile.id}/${fileName}`);
        await uploadBytes(storageRef, blob, { contentType: mediaMode === 'video' ? 'video/mp4' : 'image/jpeg' });
        mediaUrl = await getDownloadURL(storageRef);
      }

      const result = await createPost({
        mediaType: mediaMode,
        mediaUrl,
        mediaWidth: selectedMedia?.width,
        mediaHeight: selectedMedia?.height,
        mediaDurationSeconds: selectedMedia?.durationSeconds,
        caption,
        linkTarget,
      });

      if (result) {
        router.replace('/(tabs)/feed');
      }
    } catch {
      Alert.alert(t('createPost.errorTitle'), t('createPost.errorDescription'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('createPost.eyebrow')} title={t('createPost.title')} description={t('createPost.description')} />

      <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <View style={styles.row}>
          {mediaModes.map((mode) => (
            <AppButton
              key={mode}
              label={t(`createPost.mediaType${mode.charAt(0).toUpperCase()}${mode.slice(1)}`)}
              variant={mediaMode === mode ? 'secondary' : 'ghost'}
              onPress={() => {
                setMediaMode(mode);
                setSelectedMedia(null);
              }}
            />
          ))}
        </View>

        {mediaMode !== 'text' ? (
          <View style={styles.mediaPicker}>
            <AppButton
              label={selectedMedia ? t('createPost.mediaSelected') : t('createPost.pickMedia')}
              variant={selectedMedia ? 'secondary' : 'ghost'}
              onPress={() => {
                void handlePickMedia();
              }}
            />
          </View>
        ) : null}

        <AppInput label={t('createPost.captionLabel')} multiline onChangeText={setCaption} placeholder={t('createPost.captionPlaceholder')} value={caption} />

        <View style={styles.linkSection}>
          <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
            {t('createPost.linkTargetLabel')}
          </Text>
          <View style={styles.row}>
            <AppButton
              label={t('createPost.linkToShop')}
              variant={linkTarget?.type === 'seller' ? 'secondary' : 'ghost'}
              onPress={() => setLinkTarget({ type: 'seller', sellerId: currentSellerProfile.id })}
            />
            {ownedListings.map((listing) => (
              <AppButton
                key={listing.id}
                label={listing.title}
                variant={linkTarget?.type === 'listing' && linkTarget.listingId === listing.id ? 'secondary' : 'ghost'}
                onPress={() => setLinkTarget({ type: 'listing', listingId: listing.id, sellerId: currentSellerProfile.id })}
              />
            ))}
          </View>
          {!ownedListings.length ? <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('createPost.noOwnedListings')}</Text> : null}
        </View>

        {error ? <Text style={[styles.bodySmall, { color: theme.colors.error }]}>{error}</Text> : null}

        <AppButton
          disabled={isSubmitting}
          fullWidth
          label={t('createPost.submit')}
          onPress={() => {
            void handleSubmit();
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, padding: 20, gap: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  mediaPicker: { gap: 8 },
  linkSection: { gap: 8 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
