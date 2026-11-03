import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { useLocale } from '@/hooks/use-locale';
import { useAppTheme } from '@/hooks/use-theme';
import { getFriendlyAuthError } from '@/lib/errors/friendly-message';
import { useAosell } from '@/providers/aosell-provider';
import type { PostLinkTarget } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;
type SymbolName = ComponentProps<typeof SymbolView>['name'];

// A post's media can't be swapped once published (same as Instagram's own
// "edit post" — only the caption and what it links to can change), so this
// screen reuses create.tsx's caption/link UI but drops the media picker
// entirely and shows the existing media as a locked preview.
type LinkChoice = { kind: 'share' } | { kind: 'shop' } | { kind: 'listing'; listingId: string };

function linkChoiceFromTarget(linkTarget: PostLinkTarget | undefined): LinkChoice {
  if (linkTarget?.type === 'seller') {
    return { kind: 'shop' };
  }
  if (linkTarget?.type === 'listing' && linkTarget.listingId) {
    return { kind: 'listing', listingId: linkTarget.listingId };
  }
  return { kind: 'share' };
}

export default function EditPostScreen() {
  const params = useLocalSearchParams<{ postId?: string }>();
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId ?? '';
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentSellerProfile, listings, getPostById, editPost } = useAosell();
  const post = getPostById(postId);

  const [caption, setCaption] = useState(post?.caption ?? '');
  const [linkChoice, setLinkChoice] = useState<LinkChoice>(linkChoiceFromTarget(post?.linkTarget));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!post || currentSellerProfile?.id !== post.sellerId) {
    return (
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <EmptyState title={t('postDetail.notFoundTitle')} description={t('postDetail.notFoundDescription')} />
      </SafeAreaView>
    );
  }

  const ownedListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);

  async function handleSubmit() {
    if (!post) {
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const linkTarget: PostLinkTarget | undefined =
        linkChoice.kind === 'shop'
          ? { type: 'seller', sellerId: post.sellerId }
          : linkChoice.kind === 'listing'
            ? { type: 'listing', listingId: linkChoice.listingId, sellerId: post.sellerId }
            : undefined;

      await editPost(post.id, { caption, linkTarget });
      router.back();
    } catch (submitError) {
      Alert.alert(t('editPost.errorTitle'), getFriendlyAuthError(submitError));
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
          {t('editPost.title')}
        </Text>
        <Pressable accessibilityRole="button" disabled={isSubmitting} hitSlop={8} onPress={() => void handleSubmit()}>
          {isSubmitting ? (
            <ActivityIndicator color={theme.colors.accent} size="small" />
          ) : (
            <Text
              style={[
                styles.topBarAction,
                styles.topBarSubmit,
                { color: theme.colors.accent, fontFamily: theme.typography.label.fontFamily },
              ]}>
              {t('editPost.submit')}
            </Text>
          )}
        </Pressable>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {post.mediaType !== 'text' ? (
          <View style={[styles.mediaSquare, { borderRadius: theme.radii.md, overflow: 'hidden', backgroundColor: theme.colors.accentTint }]}>
            {post.mediaType === 'image' && post.mediaUrl ? (
              <Image contentFit="cover" source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} />
            ) : (
              <SymbolView tintColor={theme.colors.text} size={34} name={{ ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' }} />
            )}
          </View>
        ) : null}

        <View style={styles.captionRow}>
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

  mediaSquare: { width: MEDIA_SQUARE_SIZE, height: MEDIA_SQUARE_SIZE, alignItems: 'center', justifyContent: 'center' },

  captionRow: { flexDirection: 'row', gap: 12 },
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
