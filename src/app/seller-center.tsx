import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { StatCard } from '@/components/cards/stat-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Spacing } from '@/constants/theme';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

export default function SellerCenterScreen() {
  const { currentSellerProfile, listings, orders } = useAosell();

  if (!currentSellerProfile) {
    return (
      <AppScreen>
        <EmptyState
          title="Seller profile required"
          description="Create a seller profile first. Listings and order management attach to that storefront."
        />
        <AppButton label="Start onboarding" onPress={() => router.replace('/seller-onboarding')} />
      </AppScreen>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentSellerProfile.id);
  const revenue = sellerOrders.reduce((total, order) => total + order.total.amountCents, 0);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Seller center"
        title={currentSellerProfile.brandName}
        description={currentSellerProfile.description}
      />
      <View style={styles.stats}>
        <StatCard label="Listings" value={String(sellerListings.length)} />
        <StatCard label="Orders" value={String(sellerOrders.length)} />
        <StatCard label="Revenue" value={formatMoney({ amountCents: revenue, currency: 'EUR' })} />
      </View>
      <AppButton label="Create listing" onPress={() => router.push('/listing/edit/new')} />
      <View style={styles.grid}>
        {sellerListings.map((listing) => (
          <View key={listing.id} style={styles.gridItem}>
            <ListingCard
              listing={listing}
              sellerName={currentSellerProfile.brandName}
              onPress={() => router.push(`/listing/edit/${listing.id}`)}
            />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  gridItem: {
    flexBasis: 320,
    flexGrow: 1,
    minWidth: 280,
  },
});
