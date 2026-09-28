import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { FlatList, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/feed/post-card';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { DEFAULT_CITY } from '@/constants/location';
import { MaxContentWidth } from '@/constants/theme';
import { getCuisineLabel } from '@/lib/i18n';
import { useAosell } from '@/providers/aosell-provider';
import type { Post, SellerProfile } from '@/types/domain';

type Segment = 'forYou' | 'following' | 'city';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 65 };

export default function FeedScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const breakpoint = useBreakpoint();
  const isDesktop = Platform.OS === 'web' && breakpoint === 'desktop';
  const { feedPosts, sellers, currentSellerProfile, currentUser, followedSellerIds, getSellerById, toggleFollow } = useAosell();
  const [segment, setSegment] = useState<Segment>('forYou');
  const [activePostId, setActivePostId] = useState<string | undefined>(feedPosts[0]?.id);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const firstVisible = viewableItems.find((item) => item.isViewable);
    if (firstVisible?.item) {
      setActivePostId((firstVisible.item as Post).id);
    }
  }).current;

  const visiblePosts =
    segment === 'following'
      ? feedPosts.filter((post) => followedSellerIds.includes(post.sellerId))
      : segment === 'city'
        ? feedPosts.filter((post) => getSellerById(post.sellerId)?.city === DEFAULT_CITY)
        : feedPosts;

  const renderItem = useCallback(
    ({ item }: { item: Post }) => <PostCard isActive={item.id === activePostId} post={item} />,
    [activePostId]
  );

  if (isDesktop) {
    const suggestedSellers = sellers.filter((seller) => !followedSellerIds.includes(seller.id)).slice(0, 6);

    return (
      <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <View style={styles.desktopRow}>
          <View style={styles.desktopRail}>
            <Text style={[styles.title, styles.desktopTitle, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
              {t('tabs.feed')}
            </Text>
            {currentSellerProfile ? (
              <Pressable
                onPress={() => router.push('/post/create')}
                style={[styles.desktopPublish, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md }, theme.shadows.accent]}>
                <SymbolView tintColor={theme.colors.onAccent} size={16} name={{ ios: 'plus', android: 'add', web: 'add' }} />
                <Text style={[styles.desktopPublishText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
                  {t('common.createPost')}
                </Text>
              </Pressable>
            ) : null}
            <View style={styles.desktopRailTabs}>
              <RailTab active={segment === 'forYou'} label={t('feed.segmentForYou')} onPress={() => setSegment('forYou')} theme={theme} />
              <RailTab active={segment === 'following'} label={t('feed.segmentFollowing')} onPress={() => setSegment('following')} theme={theme} />
              <RailTab active={segment === 'city'} label={t('feed.segmentCity', { city: DEFAULT_CITY })} onPress={() => setSegment('city')} theme={theme} />
            </View>
          </View>

          <FlatList
            style={styles.desktopFeedCol}
            contentContainerStyle={styles.desktopList}
            data={visiblePosts}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                  {segment === 'following' && !currentUser ? t('feed.signInForFollowing') : t('feed.emptyTitle')}
                </Text>
                <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>{t('feed.emptyDescription')}</Text>
              </View>
            }
            onViewableItemsChanged={onViewableItemsChanged}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            viewabilityConfig={VIEWABILITY_CONFIG}
          />

          <ScrollView style={styles.desktopSuggestions} contentContainerStyle={styles.desktopSuggestionsContent} showsVerticalScrollIndicator={false}>
            <Text style={[styles.desktopSuggestionsTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('feed.suggestedSellers')}
            </Text>
            {suggestedSellers.map((seller) => (
              <SuggestedSellerRow key={seller.id} seller={seller} onFollow={() => void toggleFollow(seller.id, true)} theme={theme} />
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
          {t('tabs.feed')}
        </Text>
        {currentSellerProfile ? (
          <Pressable
            accessibilityLabel={t('common.createPost')}
            onPress={() => router.push('/post/create')}
            style={[styles.createButton, { backgroundColor: theme.colors.accent }, theme.shadows.accent]}>
            <SymbolView tintColor={theme.colors.onAccent} size={18} name={{ ios: 'plus', android: 'add', web: 'add' }} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.segmented, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
        <SegmentButton active={segment === 'forYou'} label={t('feed.segmentForYou')} onPress={() => setSegment('forYou')} theme={theme} />
        <SegmentButton active={segment === 'following'} label={t('feed.segmentFollowing')} onPress={() => setSegment('following')} theme={theme} />
        <SegmentButton active={segment === 'city'} label={t('feed.segmentCity', { city: DEFAULT_CITY })} onPress={() => setSegment('city')} theme={theme} />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={visiblePosts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {segment === 'following' && !currentUser ? t('feed.signInForFollowing') : t('feed.emptyTitle')}
            </Text>
            <Text style={[styles.emptyBody, { color: theme.colors.textMuted }]}>{t('feed.emptyDescription')}</Text>
          </View>
        }
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        viewabilityConfig={VIEWABILITY_CONFIG}
      />
    </SafeAreaView>
  );
}

function RailTab({
  active,
  label,
  onPress,
  theme,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <Pressable onPress={onPress} style={styles.railTab}>
      <Text
        style={[
          styles.railTabLabel,
          { color: active ? theme.colors.text : theme.colors.textMuted, fontFamily: active ? theme.typography.label.fontFamily : theme.typography.body.fontFamily },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SuggestedSellerRow({
  seller,
  onFollow,
  theme,
}: {
  seller: SellerProfile;
  onFollow: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  const { t } = useLocale();
  const cuisineLabel = seller.cuisineSpecialties[0] ? getCuisineLabel(seller.cuisineSpecialties[0]) : undefined;

  return (
    <Pressable onPress={() => router.push(`/seller/${seller.id}`)} style={styles.suggestedRow}>
      <View style={[styles.suggestedAvatar, { backgroundColor: theme.colors.accentTint }]}>
        <Text style={[styles.suggestedAvatarText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
          {seller.brandName.slice(0, 2).toUpperCase()}
        </Text>
      </View>
      <View style={styles.suggestedCopy}>
        <Text style={[styles.suggestedName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
          {seller.brandName}
        </Text>
        <Text style={[styles.suggestedMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {[cuisineLabel, seller.city].filter(Boolean).join(' · ')}
        </Text>
      </View>
      <Pressable
        onPress={onFollow}
        style={[styles.suggestedFollow, { borderColor: theme.colors.text, borderRadius: theme.radii.pill }]}>
        <Text style={[styles.suggestedFollowText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
          {t('postCard.follow')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function SegmentButton({
  active,
  label,
  onPress,
  theme,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.segmentButton,
        active ? { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sm + 1 } : null,
        active ? theme.shadows.sm : null,
      ]}>
      <Text
        style={[
          styles.segmentLabel,
          { color: active ? theme.colors.text : theme.colors.textMuted, fontFamily: active ? theme.typography.label.fontFamily : theme.typography.caption.fontFamily },
        ]}
        numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  title: { fontSize: 28, lineHeight: 34 },
  createButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },

  segmented: { flexDirection: 'row', marginHorizontal: 20, padding: 4, height: 40 },
  segmentButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segmentLabel: { fontSize: 13, lineHeight: 18 },

  desktopRow: { flex: 1, flexDirection: 'row', maxWidth: 1280, width: '100%', alignSelf: 'center', gap: 32, paddingHorizontal: 32, paddingTop: 12 },
  desktopRail: { width: 220, gap: 20 },
  desktopTitle: { fontSize: 24, lineHeight: 30 },
  desktopPublish: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44, paddingHorizontal: 16 },
  desktopPublishText: { fontSize: 14, lineHeight: 19 },
  desktopRailTabs: { gap: 2 },
  railTab: { paddingVertical: 10 },
  railTabLabel: { fontSize: 15, lineHeight: 20 },
  desktopFeedCol: { flex: 1, maxWidth: 620 },
  desktopList: { paddingBottom: 40, gap: 24 },
  desktopSuggestions: { width: 260 },
  desktopSuggestionsContent: { gap: 16, paddingBottom: 40 },
  desktopSuggestionsTitle: { fontSize: 17, lineHeight: 22, marginBottom: 4 },
  suggestedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  suggestedAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  suggestedAvatarText: { fontSize: 13, lineHeight: 18 },
  suggestedCopy: { flex: 1, minWidth: 0, gap: 1 },
  suggestedName: { fontSize: 14, lineHeight: 19 },
  suggestedMeta: { fontSize: 12, lineHeight: 16 },
  suggestedFollow: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  suggestedFollowText: { fontSize: 12, lineHeight: 16 },

  list: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 24,
  },

  empty: { paddingTop: 40, alignItems: 'center', gap: 6, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, lineHeight: 24 },
  emptyBody: { fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
