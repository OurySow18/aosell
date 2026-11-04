import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
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
const AVATAR_SIZE = 88;

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
      <View style={styles.topRow}>
        <Pressable accessibilityLabel={t('profileScreen.settingsAction')} onPress={() => router.push('/settings')}>
          <SymbolView tintColor={theme.colors.text} size={22} name={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.border, borderRadius: AVATAR_SIZE / 2 }]}>
          {userProfile.avatarUrl ? (
            <Image contentFit="cover" source={{ uri: userProfile.avatarUrl }} style={StyleSheet.absoluteFillObject} />
          ) : (
            <Text style={[styles.avatarInitials, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {userProfile.displayName.slice(0, 2).toUpperCase()}
            </Text>
          )}
        </View>

        <Text style={[styles.displayName, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
          {userProfile.displayName}
        </Text>
        <Text style={[styles.email, { color: theme.colors.textMuted }]}>{currentUser.email}</Text>

        <View style={styles.badgeRow}>
          <StatusPill label={currentUser.role === 'seller' ? t('auth.seller') : t('auth.buyer')} tone="brand" />
          {currentSellerProfile ? <StatusPill label={t('profileScreen.sellerProfileActive')} tone="success" /> : null}
        </View>

        <View style={styles.statBlock}>
          <Text style={[styles.statValue, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {myPosts.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.colors.textMuted }]}>{t('profileScreen.postsStat')}</Text>
        </View>

        {userProfile.bio ? <Text style={[styles.bio, { color: theme.colors.text }]}>{userProfile.bio}</Text> : null}

        <Pressable
          onPress={() => router.push('/edit-profile')}
          style={[styles.editButton, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
          <Text style={[styles.editButtonText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {t('editProfile.title')}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.tabRow, { borderBottomColor: theme.colors.border }]}>
        <ProfileTab active={contentTab === 'all'} label={t('profileScreen.tabAll')} onPress={() => setContentTab('all')} theme={theme} />
        <ProfileTab active={contentTab === 'reels'} label={t('profileScreen.tabReels')} onPress={() => setContentTab('reels')} theme={theme} />
      </View>

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

function ProfileTab({ active, label, onPress, theme }: { active: boolean; label: string; onPress: () => void; theme: AppTheme }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && { borderBottomColor: theme.colors.text }]}>
      <Text
        style={[
          styles.tabLabel,
          { color: active ? theme.colors.text : theme.colors.textMuted, fontFamily: active ? theme.typography.label.fontFamily : theme.typography.body.fontFamily },
        ]}>
        {label}
      </Text>
    </Pressable>
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
      {post.likeCount > 0 ? (
        <View pointerEvents="none" style={styles.tileLikeBadge}>
          <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={11} tintColor="#FFFFFF" />
          <Text style={styles.tileLikeCount}>{post.likeCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'flex-end' },

  header: { alignItems: 'center', gap: 4 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, alignItems: 'center', justifyContent: 'center', borderWidth: 1, overflow: 'hidden', marginBottom: 6 },
  avatarInitials: { fontSize: 26, lineHeight: 32 },
  displayName: { fontSize: 20, lineHeight: 26, textAlign: 'center' },
  email: { fontSize: 13, lineHeight: 18 },

  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 },

  statBlock: { alignItems: 'center', marginTop: 12 },
  statValue: { fontSize: 20, lineHeight: 25 },
  statLabel: { fontSize: 12, lineHeight: 16 },

  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 10, paddingHorizontal: 20 },

  editButton: { minWidth: 180, height: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, marginTop: 14 },
  editButtonText: { fontSize: 14, lineHeight: 18 },

  tabRow: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabLabel: { fontSize: 14, lineHeight: 18 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  videoTile: { alignItems: 'center', justifyContent: 'center' },
  textTile: { padding: 8, justifyContent: 'center' },
  textTileCaption: { color: '#FFFFFF', fontSize: 11, lineHeight: 14 },
  tileLikeBadge: { position: 'absolute', left: 6, bottom: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  tileLikeCount: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  emptyGrid: { gap: 12 },

  loadingEmail: { textAlign: 'center', fontSize: 13, lineHeight: 18 },
});
