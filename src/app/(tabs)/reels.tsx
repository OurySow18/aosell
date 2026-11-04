import { useIsFocused } from '@react-navigation/native';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { ComponentProps } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ListRenderItemInfo, ViewToken } from 'react-native';
import { Alert, Animated, FlatList, Platform, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/empty-state';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useLocale } from '@/hooks/use-locale';
import { buildPostShareMessage } from '@/lib/posts';
import { PostRepository } from '@/repositories/post-repository';
import { useAosell } from '@/providers/aosell-provider';
import { useVideoSound } from '@/providers/video-sound-provider';
import type { Post, SellerProfile } from '@/types/domain';

const DOUBLE_TAP_WINDOW_MS = 280;
const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 70 };
const MAX_WEB_VIDEO_WIDTH = 420;

type SymbolName = ComponentProps<typeof SymbolView>['name'];

// Full-screen, video-only, swipe-through viewer — the Reels/TikTok counterpart
// to the card-based Home feed. Tapping a video anywhere else in the app (see
// post-card.tsx's onSingleTap) lands here, deep-linked to that exact post via
// the postId param.
export default function ReelsScreen() {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  // Full-bleed, overlaid controls suit a phone screen (native app, or a
  // narrow mobile browser) — on wider web, that same layout reads as broken
  // rather than immersive, so it switches to a centered column with controls
  // beside the video and explicit up/down navigation, the way Facebook and
  // TikTok's own web Reels/video pages do.
  const isWideWeb = Platform.OS === 'web' && breakpoint !== 'mobile';
  // Tabs stay mounted when you switch away from one — without this, a video
  // left playing when this tab loses focus (another tab, or a pushed screen
  // like post detail/comments) would keep playing silently in the background.
  const isScreenFocused = useIsFocused();
  const params = useLocalSearchParams<{ postId?: string }>();
  const requestedPostId = Array.isArray(params.postId) ? params.postId[0] : params.postId;
  const { feedPosts, currentSellerProfile, getSellerById, followedSellerIds, toggleFollow, toggleLike, deletePost } = useAosell();

  const reels = useMemo(() => feedPosts.filter((post) => post.mediaType === 'video' && post.mediaUrl), [feedPosts]);

  const [itemHeight, setItemHeight] = useState(0);
  const [activePostId, setActivePostId] = useState<string | undefined>(reels[0]?.id);
  const listRef = useRef<FlatList<Post>>(null);
  const appliedDeepLinkFor = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!requestedPostId || !itemHeight || !reels.length || appliedDeepLinkFor.current === requestedPostId) {
      return;
    }
    const index = reels.findIndex((post) => post.id === requestedPostId);
    if (index < 0) {
      return;
    }
    appliedDeepLinkFor.current = requestedPostId;
    setActivePostId(requestedPostId);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ animated: false, index });
    });
  }, [requestedPostId, itemHeight, reels]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisible = viewableItems.find((item) => item.isViewable);
    if (firstVisible?.item) {
      setActivePostId((firstVisible.item as Post).id);
    }
  }).current;

  const getItemLayout = useCallback(
    (_: ArrayLike<Post> | null | undefined, index: number) => ({ length: itemHeight, offset: itemHeight * index, index }),
    [itemHeight]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= reels.length) {
        return;
      }
      listRef.current?.scrollToIndex({ animated: true, index });
    },
    [reels.length]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<Post>) => (
      <ReelItem
        canGoNext={index < reels.length - 1}
        canGoPrev={index > 0}
        height={itemHeight}
        isActive={item.id === activePostId && isScreenFocused}
        isOwner={currentSellerProfile?.id === item.sellerId}
        isFollowing={followedSellerIds.includes(item.sellerId)}
        isWideWeb={isWideWeb}
        onDelete={() => void deletePost(item.id)}
        onFollow={() => void toggleFollow(item.sellerId, !followedSellerIds.includes(item.sellerId))}
        onLike={(liked) => void toggleLike(item.id, liked)}
        onNext={() => scrollToIndex(index + 1)}
        onPrev={() => scrollToIndex(index - 1)}
        post={item}
        seller={getSellerById(item.sellerId)}
      />
    ),
    [
      activePostId,
      currentSellerProfile?.id,
      deletePost,
      followedSellerIds,
      getSellerById,
      isScreenFocused,
      isWideWeb,
      itemHeight,
      reels.length,
      scrollToIndex,
      toggleFollow,
      toggleLike,
    ]
  );

  return (
    <View onLayout={(event) => setItemHeight(event.nativeEvent.layout.height)} style={styles.root}>
      {itemHeight > 0 ? (
        reels.length ? (
          <FlatList
            contentContainerStyle={styles.listContent}
            data={reels}
            decelerationRate="fast"
            getItemLayout={getItemLayout}
            initialNumToRender={2}
            keyExtractor={(item) => item.id}
            maxToRenderPerBatch={2}
            onScrollToIndexFailed={() => undefined}
            onViewableItemsChanged={onViewableItemsChanged}
            pagingEnabled
            ref={listRef}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            snapToInterval={itemHeight}
            style={styles.list}
            viewabilityConfig={VIEWABILITY_CONFIG}
            windowSize={3}
          />
        ) : (
          <View style={[styles.empty, { paddingTop: insets.top + 60 }]}>
            <EmptyState description={t('reels.emptyDescription')} title={t('reels.emptyTitle')} />
          </View>
        )
      ) : null}

      <View pointerEvents="none" style={[styles.titleBar, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.titleText}>{t('tabs.reels')}</Text>
      </View>
    </View>
  );
}

function ReelItem({
  canGoNext,
  canGoPrev,
  height,
  isActive,
  isFollowing,
  isOwner,
  isWideWeb,
  onDelete,
  onFollow,
  onLike,
  onNext,
  onPrev,
  post,
  seller,
}: {
  canGoNext: boolean;
  canGoPrev: boolean;
  height: number;
  isActive: boolean;
  isFollowing: boolean;
  isOwner: boolean;
  isWideWeb: boolean;
  onDelete: () => void;
  onFollow: () => void;
  onLike: (liked: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  post: Post;
  seller: SellerProfile | undefined;
}) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAosell();
  const { soundOn, toggleSound } = useVideoSound();
  const player = useVideoPlayer(post.mediaUrl ?? '', (instance) => {
    instance.loop = true;
    instance.muted = !soundOn;
  });

  const [liked, setLiked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const heartAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const singleTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentUser) {
      setLiked(false);
      return;
    }
    return PostRepository.subscribeLikeStatus(post.id, currentUser.id, setLiked);
  }, [post.id, currentUser?.id]);

  // Leaving the video (scrolled away, or the whole Reels tab losing focus)
  // always resets the manual pause, so the video autoplays again next time
  // it becomes the active one instead of staying stuck paused.
  useEffect(() => {
    if (!isActive) {
      setIsPaused(false);
    }
  }, [isActive]);

  useEffect(() => {
    if (isActive && !isPaused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isPaused, player]);

  useEffect(() => {
    player.muted = !soundOn;
  }, [player, soundOn]);

  useEffect(
    () => () => {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
      }
    },
    []
  );

  function playHeartBurst() {
    heartAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 0, duration: 120, delay: 60, useNativeDriver: true }),
    ]).start();
  }

  function handleLikeToggle(nextLiked: boolean) {
    if (!currentUser) {
      router.push({ pathname: '/auth', params: { mode: 'signup', role: 'buyer' } });
      return;
    }
    setLiked(nextLiked);
    onLike(nextLiked);
  }

  function handlePress() {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_WINDOW_MS) {
      if (singleTapTimer.current) {
        clearTimeout(singleTapTimer.current);
        singleTapTimer.current = null;
      }
      lastTapRef.current = 0;
      if (currentUser) {
        playHeartBurst();
        if (!liked) {
          handleLikeToggle(true);
        }
      }
    } else {
      lastTapRef.current = now;
      singleTapTimer.current = setTimeout(() => {
        singleTapTimer.current = null;
        setIsPaused((current) => !current);
      }, DOUBLE_TAP_WINDOW_MS);
    }
  }

  function handleShare() {
    void Share.share({ message: buildPostShareMessage({ caption: post.caption, postId: post.id }) });
  }

  function handleMore() {
    Alert.alert(t('postCard.moreAction'), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.modify'), onPress: () => router.push(`/post/edit/${post.id}`) },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          Alert.alert(t('postDetail.deleteTitle'), t('postDetail.deleteDescription'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: onDelete },
          ]);
        },
      },
    ]);
  }

  const videoWidth = isWideWeb ? Math.min(height * (9 / 16), MAX_WEB_VIDEO_WIDTH) : undefined;

  return (
    <View style={[styles.item, { height }, isWideWeb && styles.itemWideWeb]}>
      <View style={isWideWeb ? [styles.videoFrame, { width: videoWidth, height }] : styles.videoFrameFill}>
        <Pressable onPress={handlePress} style={StyleSheet.absoluteFillObject}>
          {/* The wide-web frame is a fixed 9:16 box, not the video's real
              aspect ratio — "cover" would crop unpredictably, so it only
              crops to fill edge to edge on native/mobile, where the frame IS
              the full screen and cropping is the expected Reels look. */}
          <VideoView
            contentFit={isWideWeb ? 'contain' : 'cover'}
            nativeControls={false}
            player={player}
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
          />
          {isPaused ? (
            <View pointerEvents="none" style={styles.pauseOverlay}>
              <SymbolView name={{ ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' }} size={30} tintColor="#FFFFFF" />
            </View>
          ) : null}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.heartBurst,
              { opacity: heartAnim, transform: [{ scale: heartAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }] },
            ]}>
            <SymbolView name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }} size={96} tintColor="#FFFFFF" />
          </Animated.View>
        </Pressable>

        <View style={[styles.bottomCopy, { bottom: insets.bottom + 18, right: isWideWeb ? 16 : 84 }]}>
          <View style={styles.sellerRow}>
            <Text style={styles.sellerName}>{seller?.brandName ?? t('listingDetail.sellerFallback')}</Text>
            {!isOwner ? (
              <Pressable onPress={onFollow} style={[styles.followPill, isFollowing && styles.followPillActive]}>
                <Text style={styles.followPillText}>{isFollowing ? t('postCard.following') : t('postCard.follow')}</Text>
              </Pressable>
            ) : null}
          </View>
          {post.caption ? (
            <Text numberOfLines={2} style={styles.caption}>
              {post.caption}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.actionColumn, isWideWeb ? styles.actionColumnWideWeb : [styles.actionColumnOverlay, { bottom: insets.bottom + 110 }]]}>
        <ReelAction
          count={post.likeCount}
          icon={liked ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
          onPress={() => handleLikeToggle(!liked)}
          tint={liked ? '#FF3B5C' : '#FFFFFF'}
        />
        <ReelAction
          count={post.commentCount}
          icon={{ ios: 'bubble.right', android: 'chat_bubble_outline', web: 'chat_bubble_outline' }}
          onPress={() => router.push(`/post/${post.id}`)}
          tint="#FFFFFF"
        />
        <ReelAction
          icon={{ ios: 'arrowshape.turn.up.right', android: 'share', web: 'share' }}
          onPress={handleShare}
          tint="#FFFFFF"
        />
        <ReelAction
          icon={soundOn ? { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' } : { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' }}
          onPress={toggleSound}
          tint="#FFFFFF"
        />
        {isOwner ? (
          <ReelAction icon={{ ios: 'ellipsis', android: 'more_vert', web: 'more_vert' }} onPress={handleMore} tint="#FFFFFF" />
        ) : null}
      </View>

      {isWideWeb ? (
        <View style={styles.chevronColumn}>
          <Pressable disabled={!canGoPrev} onPress={onPrev} style={[styles.chevronButton, !canGoPrev && styles.chevronDisabled]}>
            <SymbolView name={{ ios: 'chevron.up', android: 'keyboard_arrow_up', web: 'keyboard_arrow_up' }} size={22} tintColor="#FFFFFF" />
          </Pressable>
          <Pressable disabled={!canGoNext} onPress={onNext} style={[styles.chevronButton, !canGoNext && styles.chevronDisabled]}>
            <SymbolView name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }} size={22} tintColor="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function ReelAction({
  count,
  icon,
  onPress,
  tint,
}: {
  count?: number;
  icon: SymbolName;
  onPress: () => void;
  tint: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionButton}>
      <SymbolView name={icon} size={28} tintColor={tint} />
      {typeof count === 'number' && count > 0 ? <Text style={styles.actionCount}>{count}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  // Without an explicit style, react-native-web's FlatList doesn't reliably
  // stretch to fill its parent or keep a single-column flow — items can end
  // up side by side instead of stacked and paged vertically.
  list: { flex: 1, width: '100%' },
  listContent: { flexDirection: 'column' },
  item: { width: '100%', backgroundColor: '#000000' },
  empty: { paddingHorizontal: 20 },

  titleBar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center' },
  titleText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },

  heartBurst: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  pauseOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionColumn: { alignItems: 'center', gap: 20 },
  actionColumnOverlay: { position: 'absolute', right: 12 },
  actionColumnWideWeb: { position: 'relative' },
  actionButton: { alignItems: 'center', gap: 4 },
  actionCount: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },

  bottomCopy: { position: 'absolute', left: 16, right: 84, gap: 6 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sellerName: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  followPill: { borderWidth: 1, borderColor: '#FFFFFF', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  followPillActive: { borderColor: 'rgba(255,255,255,0.5)' },
  followPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  caption: { color: '#FFFFFF', fontSize: 14, lineHeight: 19 },

  itemWideWeb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  videoFrame: { position: 'relative', overflow: 'hidden', borderRadius: 12, backgroundColor: '#000000' },
  videoFrameFill: { ...StyleSheet.absoluteFillObject },

  chevronColumn: { gap: 12 },
  chevronButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  chevronDisabled: { opacity: 0.3 },
});
