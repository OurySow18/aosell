import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { PostMedia } from '@/components/feed/post-media';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { buildPostShareMessage } from '@/lib/posts';
import { formatMoney, formatRelativeTime } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { PostRepository } from '@/repositories/post-repository';
import { useAosell } from '@/providers/aosell-provider';
import type { Post } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;
type SymbolName = ComponentProps<typeof SymbolView>['name'];

export function PostCard({ post, isActive = false }: { post: Post; isActive?: boolean }) {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, getSellerById, getListingById, toggleLike, toggleFollow, followedSellerIds } = useAosell();
  const seller = getSellerById(post.sellerId);
  const linkedListing = post.linkTarget.type === 'listing' && post.linkTarget.listingId ? getListingById(post.linkTarget.listingId) : undefined;
  const isFollowing = followedSellerIds.includes(post.sellerId);

  const [liked, setLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const heartAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!currentUser) {
      setLiked(false);
      return;
    }
    return PostRepository.subscribeLikeStatus(post.id, currentUser.id, setLiked);
  }, [post.id, currentUser?.id]);

  function requireAuth() {
    router.push({ pathname: '/auth', params: { mode: 'signup', role: 'buyer' } });
  }

  function handleLikePress() {
    if (!currentUser) {
      requireAuth();
      return;
    }
    void toggleLike(post.id, !liked);
  }

  function playHeartBurst() {
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 0, duration: 120, delay: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleDoubleTap() {
    if (!currentUser) {
      requireAuth();
      return;
    }
    playHeartBurst();
    if (!liked) {
      void toggleLike(post.id, true);
    }
  }

  function handleFollowPress() {
    if (!currentUser) {
      requireAuth();
      return;
    }
    void toggleFollow(post.sellerId, !isFollowing);
  }

  function handleSharePress() {
    void Share.share({ message: buildPostShareMessage({ caption: post.caption, postId: post.id }) });
  }

  function handleOrderPress() {
    if (post.linkTarget.type === 'listing' && post.linkTarget.listingId) {
      router.push(`/listing/${post.linkTarget.listingId}`);
    } else if (post.linkTarget.sellerId) {
      router.push(`/seller/${post.linkTarget.sellerId}`);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.sellerRow}>
        <Pressable disabled={!seller} onPress={() => seller && router.push(`/seller/${seller.id}`)} style={styles.sellerLeft}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint }]}>
            <Text style={[styles.avatarText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {(seller?.brandName ?? 'AS').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.sellerCopy}>
            <Text style={[styles.sellerName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {seller?.brandName ?? t('listingDetail.sellerFallback')}
            </Text>
            <Text style={[styles.sellerMeta, { color: theme.colors.textMuted }]}>
              {[seller?.city, formatRelativeTime(post.createdAt)].filter(Boolean).join(' · ')}
            </Text>
          </View>
        </Pressable>

        {currentUser?.id && seller && seller.ownerUserId !== currentUser.id ? (
          <Pressable onPress={handleFollowPress}>
            <Text style={[styles.followText, { color: isFollowing ? theme.colors.textMuted : theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {isFollowing ? t('postCard.following') : t('postCard.follow')}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.mediaWrap}>
        <PostMedia isActive={isActive} onDoubleTap={handleDoubleTap} post={post} />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.heartBurst,
            { opacity: heartAnim, transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] },
          ]}>
          <SymbolView tintColor="#FFFFFF" size={72} name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} />
        </Animated.View>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionsLeft}>
          <ActionButton
            accessibilityLabel={t('postCard.likeAction')}
            count={post.likeCount}
            icon={liked ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
            iconColor={liked ? theme.colors.secondaryStrong : theme.colors.text}
            onPress={handleLikePress}
          />
          <ActionButton
            accessibilityLabel={t('postCard.commentAction')}
            count={post.commentCount}
            icon={{ ios: 'bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
            iconColor={theme.colors.text}
            onPress={() => router.push(`/post/${post.id}`)}
          />
          <ActionButton
            accessibilityLabel={t('postCard.shareAction')}
            icon={{ ios: 'arrowshape.turn.up.right', android: 'share', web: 'share' }}
            iconColor={theme.colors.text}
            onPress={handleSharePress}
          />
        </View>

        <Pressable accessibilityLabel={t('postCard.saveAction')} onPress={() => setIsSaved((current) => !current)}>
          <SymbolView
            tintColor={theme.colors.text}
            size={22}
            name={isSaved ? { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' } : { ios: 'bookmark', android: 'bookmark_border', web: 'bookmark_border' }}
          />
        </Pressable>
      </View>

      {post.caption ? (
        <Text style={[styles.captionLine, { color: theme.colors.text }]}>
          <Text style={{ fontFamily: theme.typography.label.fontFamily }}>{seller?.brandName ?? ''} </Text>
          {post.caption}
        </Text>
      ) : null}

      {post.commentCount > 0 ? (
        <Pressable onPress={() => router.push(`/post/${post.id}`)}>
          <Text style={[styles.viewComments, { color: theme.colors.textMuted }]}>
            {t('postCard.viewComments', { count: post.commentCount })}
          </Text>
        </Pressable>
      ) : null}

      {linkedListing ? (
        <Pressable
          onPress={() => router.push(`/listing/${linkedListing.id}`)}
          style={[styles.linkedCard, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.lg }]}>
          <View style={[styles.linkedThumb, { backgroundColor: theme.colors.accentTint }]}>
            {getPrimaryListingImage(linkedListing)?.url ? (
              <Image
                contentFit="cover"
                source={{ uri: getPrimaryListingImage(linkedListing)!.url }}
                style={StyleSheet.absoluteFillObject}
                transition={200}
              />
            ) : null}
          </View>
          <View style={styles.linkedCopy}>
            <Text style={[styles.linkedName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
              {linkedListing.title}
            </Text>
            <Text style={[styles.linkedMeta, { color: theme.colors.textMuted }]}>{formatMoney(linkedListing.price)}</Text>
          </View>
          <Pressable
            onPress={handleOrderPress}
            style={[styles.orderButton, { backgroundColor: theme.colors.accent }]}>
            <Text style={[styles.orderButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
              {t('postCard.orderAction')}
            </Text>
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

function ActionButton({
  accessibilityLabel,
  count,
  icon,
  iconColor,
  onPress,
}: {
  accessibilityLabel: string;
  count?: number;
  icon: SymbolName;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={styles.actionButton}>
      <SymbolView tintColor={iconColor} size={24} name={icon} />
      {typeof count === 'number' && count > 0 ? <Text style={styles.actionCount}>{count}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 10 },
  sellerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, lineHeight: 18 },
  sellerCopy: { gap: 1, flexShrink: 1 },
  sellerName: { fontSize: 15, lineHeight: 20 },
  sellerMeta: { fontSize: 13, lineHeight: 18 },
  followText: { fontSize: 13, lineHeight: 18 },

  mediaWrap: { position: 'relative' },
  heartBurst: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },

  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, paddingTop: 10, paddingBottom: 4 },
  actionsLeft: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 15, lineHeight: 20, fontWeight: '700' },

  captionLine: { fontSize: 15, lineHeight: 21, paddingHorizontal: 4, marginTop: 2 },
  viewComments: { fontSize: 13, lineHeight: 18, paddingHorizontal: 4, marginTop: 4 },

  linkedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, marginTop: 10 },
  linkedThumb: { width: 40, height: 40, borderRadius: 10, overflow: 'hidden' },
  linkedCopy: { flex: 1, gap: 1 },
  linkedName: { fontSize: 14, lineHeight: 18 },
  linkedMeta: { fontSize: 13, lineHeight: 18 },
  orderButton: { height: 36, borderRadius: 12, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  orderButtonText: { fontSize: 13, lineHeight: 18 },
});
