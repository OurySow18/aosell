import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useRef, useState } from 'react';
import type { ViewToken } from 'react-native';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PostCard } from '@/components/feed/post-card';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { DEFAULT_CITY } from '@/constants/location';
import { MaxContentWidth } from '@/constants/theme';
import { useAosell } from '@/providers/aosell-provider';
import type { Post } from '@/types/domain';

type Segment = 'forYou' | 'following' | 'city';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 65 };

export default function FeedScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { feedPosts, currentSellerProfile, currentUser, followedSellerIds, getSellerById } = useAosell();
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
