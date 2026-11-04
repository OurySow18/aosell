import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { StatusPill } from '@/components/ui/status-pill';
import { MaxContentWidth, palette } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { useAosell } from '@/providers/aosell-provider';
import type { Post } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;
type ContentTab = 'all' | 'reels';

const GRID_GAP = 2;
const GRID_COLUMNS = 3;

export default function ProfileScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { width } = useWindowDimensions();
  const { currentUser, userProfile, currentSellerProfile, feedPosts } = useAosell();
  const [contentTab, setContentTab] = useState<ContentTab>('all');

  function openSignIn() {
    router.push({ pathname: '/auth', params: { mode: 'signin', returnTo: '/profile' } });
  }

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState title={t('profileScreen.noProfileTitle')} description={t('profileScreen.noProfileDescription')} />
        <AppButton fullWidth label={t('common.signIn')} onPress={openSignIn} />
      </AppScreen>
    );
  }

  if (!userProfile) {
    return (
      <AppScreen>
        <EmptyState title={t('profileScreen.loadingTitle')} description={t('profileScreen.loadingDescription')} />
        <Text style={[styles.loadingEmail, { color: theme.colors.textMuted }]}>{currentUser.email}</Text>
      </AppScreen>
    );
  }

  const myPosts = currentSellerProfile ? feedPosts.filter((post) => post.sellerId === currentSellerProfile.id) : [];
  const visiblePosts = contentTab === 'reels' ? myPosts.filter((post) => post.mediaType === 'video') : myPosts;

  const contentWidth = Math.min(width, MaxContentWidth) - 40;
  const tileSize = (contentWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

  function openPost(post: Post) {
    if (post.mediaType === 'video') {
      router.push({ pathname: '/reels', params: { postId: post.id } });
    } else {
      router.push(`/post/${post.id}`);
    }
  }

  return (
    <AppScreen>
      <View style={styles.headerRow}>
        <View style={styles.headerTitleWrap}>
          <SectionTitle
            eyebrow={t('profileScreen.eyebrow')}
            title={userProfile.displayName}
            description={userProfile.bio ?? t('profileScreen.fallbackDescription')}
          />
        </View>
        <Pressable
          accessibilityLabel={t('profileScreen.settingsAction')}
          onPress={() => router.push('/settings')}
          style={[styles.settingsButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }} />
        </Pressable>
      </View>

      <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            {userProfile.avatarUrl ? (
              <Image contentFit="cover" source={{ uri: userProfile.avatarUrl }} style={StyleSheet.absoluteFillObject} />
            ) : (
              <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
                {userProfile.displayName.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.heroCopy}>
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {userProfile.displayName}
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {currentUser.email}
            </Text>
          </View>
        </View>
        <View style={styles.row}>
          <StatusPill label={currentUser.role === 'seller' ? t('auth.seller') : t('auth.buyer')} tone="brand" />
          {currentSellerProfile ? <StatusPill label={t('profileScreen.sellerProfileActive')} tone="success" /> : null}
        </View>
        <View style={styles.statsRow}>
          <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {myPosts.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('profileScreen.postsStat')}</Text>
        </View>
        <AppButton fullWidth label={t('editProfile.title')} variant="secondary" onPress={() => router.push('/edit-profile')} />
      </View>

      <SegmentedControl
        onChange={setContentTab}
        options={[
          { value: 'all', label: t('profileScreen.tabAll') },
          { value: 'reels', label: t('profileScreen.tabReels') },
        ]}
        value={contentTab}
      />

      {visiblePosts.length ? (
        <View style={styles.grid}>
          {visiblePosts.map((post, index) => (
            <PostGridTile
              key={post.id}
              onPress={() => openPost(post)}
              post={post}
              size={tileSize}
              style={{
                marginRight: (index + 1) % GRID_COLUMNS === 0 ? 0 : GRID_GAP,
                marginBottom: GRID_GAP,
              }}
              theme={theme}
            />
          ))}
        </View>
      ) : (
        <View style={styles.emptyGrid}>
          <EmptyState
            description={t(contentTab === 'reels' ? 'profileScreen.noReelsDescription' : 'profileScreen.noPostsDescription')}
            title={t(contentTab === 'reels' ? 'profileScreen.noReelsTitle' : 'profileScreen.noPostsTitle')}
          />
          <AppButton fullWidth label={t('common.createPost')} onPress={() => router.push('/post/create')} />
        </View>
      )}
    </AppScreen>
  );
}

function PostGridTile({
  onPress,
  post,
  size,
  style,
  theme,
}: {
  onPress: () => void;
  post: Post;
  size: number;
  style: { marginRight: number; marginBottom: number };
  theme: AppTheme;
}) {
  return (
    <Pressable onPress={onPress} style={[{ width: size, height: size, overflow: 'hidden' }, style]}>
      {post.mediaType === 'image' && post.mediaUrl ? (
        <Image contentFit="cover" source={{ uri: post.mediaUrl }} style={StyleSheet.absoluteFillObject} />
      ) : post.mediaType === 'video' ? (
        <View style={[StyleSheet.absoluteFillObject, styles.videoTile, { backgroundColor: theme.colors.accentTint }]}>
          <SymbolView tintColor={theme.colors.text} size={22} name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} />
        </View>
      ) : (
        // Fixed ink background regardless of theme, matching post-media.tsx's
        // text-post card — theme.colors.text flips to near-white in dark
        // mode, which would leave this white caption unreadable against it.
        <View style={[StyleSheet.absoluteFillObject, styles.textTile, { backgroundColor: palette.ink }]}>
          <Text numberOfLines={5} style={styles.textTileCaption}>
            {post.caption}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerTitleWrap: { flex: 1, minWidth: 0 },
  settingsButton: { width: 40, height: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  heroCard: { borderWidth: 1, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden' },
  heroCopy: { gap: 4, flex: 1 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  statValue: { fontSize: 20, lineHeight: 25 },
  statLabel: { fontSize: 13, lineHeight: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  videoTile: { alignItems: 'center', justifyContent: 'center' },
  textTile: { padding: 8, justifyContent: 'center' },
  textTileCaption: { color: '#FFFFFF', fontSize: 11, lineHeight: 14 },

  emptyGrid: { gap: 12 },

  loadingEmail: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
  title: { fontSize: 22, lineHeight: 28 },
  body: { fontSize: 15, lineHeight: 21 },
});
