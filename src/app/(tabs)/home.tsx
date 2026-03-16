import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { ListingCard } from '@/components/cards/listing-card';
import { SellerCard } from '@/components/cards/seller-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function HomeScreen() {
  const theme = useTheme();
  const { listings, sellers } = useAosell();

  const featured = listings.filter((listing) => listing.isFeatured).slice(0, 4);
  const latest = [...listings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);
  const restaurants = listings.filter((listing) => listing.type === 'meal').slice(0, 4);
  const shops = sellers.filter((seller) => seller.type === 'shop').slice(0, 3);
  const sellersToDiscover = sellers.slice(0, 3);

  return (
    <AppScreen>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.heroTop}>
          <AosellLogo compact />
          <StatusPill label="Germany launch" tone="brand" />
        </View>
        <View style={styles.heroCopy}>
          <ThemedText type="display">Curated discovery, not endless scrolling.</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            Products, meals, and services from verified sellers with a premium, editorial home experience.
          </ThemedText>
        </View>
        <View style={styles.heroActions}>
          <AppButton label="Search listings" onPress={() => router.push('/search')} />
          <AppButton label="Open cart" variant="ghost" onPress={() => router.push('/cart')} />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="Featured" title="Featured listings" />
        <FlatList
          data={featured}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.horizontalCard}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="New arrivals" title="Latest listings" />
        <View style={styles.grid}>
          {latest.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="Restaurants" title="Meals worth a delivery detour" />
        <View style={styles.grid}>
          {restaurants.map((item) => (
            <View key={item.id} style={styles.gridItem}>
              <ListingCard
                listing={item}
                sellerName={sellers.find((seller) => seller.id === item.sellerId)?.brandName}
                onPress={() => router.push(`/listing/${item.id}`)}
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="Shops" title="Stores to discover" />
        <View style={styles.grid}>
          {shops.map((seller) => (
            <View key={seller.id} style={styles.gridItem}>
              <SellerCard seller={seller} onPress={() => router.push(`/seller/${seller.id}`)} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle eyebrow="People" title="Sellers to discover" />
        <View style={styles.grid}>
          {sellersToDiscover.map((seller) => (
            <Pressable
              key={seller.id}
              style={[styles.inlineSeller, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push(`/seller/${seller.id}`)}>
              <ThemedText type="headline">{seller.brandName}</ThemedText>
              <ThemedText type="body" themeColor="textSecondary">
                {seller.description}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
  },
  heroCopy: {
    gap: Spacing.md,
    maxWidth: 760,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  section: {
    gap: Spacing.lg,
  },
  horizontalCard: {
    width: 320,
    marginRight: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  gridItem: {
    minWidth: 280,
    flexBasis: 320,
    flexGrow: 1,
  },
  inlineSeller: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
});
