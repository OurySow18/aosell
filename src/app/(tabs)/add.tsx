import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StatCard } from '@/components/cards/stat-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Spacing } from '@/constants/theme';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

export default function AddScreen() {
  const { currentUser, currentSellerProfile, listings, orders } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title="Seller tools need an account"
          description="Create an account first, then set up your seller profile and storefront."
        />
        <AppButton label="Open authentication" onPress={() => router.push('/auth')} />
      </AppScreen>
    );
  }

  if (!currentSellerProfile) {
    return (
      <AppScreen>
        <SectionTitle
          eyebrow="Seller center"
          title="Start seller onboarding"
          description="Choose your seller type, describe your offer, and define delivery modes before publishing listings."
        />
        <AppButton label="Create seller profile" onPress={() => router.push('/seller-onboarding')} />
      </AppScreen>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentSellerProfile.id);
  const revenue = sellerOrders.reduce((sum, order) => sum + order.total.amountCents, 0);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Seller dashboard"
        title={currentSellerProfile.brandName}
        description="Manage listings, incoming orders, and storefront health from one place."
      />
      <View style={styles.stats}>
        <StatCard label="Listings" value={String(sellerListings.length)} />
        <StatCard label="Orders" value={String(sellerOrders.length)} />
        <StatCard label="Revenue" value={formatMoney({ amountCents: revenue, currency: 'EUR' })} />
      </View>
      <View style={styles.actions}>
        <AppButton label="Create listing" onPress={() => router.push('/listing/edit/new')} />
        <AppButton label="Open seller center" variant="secondary" onPress={() => router.push('/seller-center')} />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  actions: {
    gap: Spacing.md,
  },
});
