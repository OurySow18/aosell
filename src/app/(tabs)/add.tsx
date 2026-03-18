import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { StatCard } from '@/components/cards/stat-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

export default function AddScreen() {
  const { t } = useLocale();
  const { currentUser, currentSellerProfile, listings, orders } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title={t('addScreen.noAccountTitle')}
          description={t('addScreen.noAccountDescription')}
        />
        <AppButton
          label={t('common.createSellerAccount')}
          onPress={() =>
            router.push({
              pathname: '/auth',
              params: {
                mode: 'signup',
                role: 'seller',
                returnTo: '/add',
              },
            })
          }
        />
      </AppScreen>
    );
  }

  if (!currentSellerProfile) {
    return (
      <AppScreen>
        <SectionTitle
          eyebrow={t('addScreen.sellerCenterEyebrow')}
          title={t('addScreen.startSetupTitle')}
          description={t('addScreen.startSetupDescription')}
        />
        <AppButton fullWidth label={t('common.createSellerProfile')} onPress={() => router.push('/seller-onboarding')} />
      </AppScreen>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentSellerProfile.id);
  const revenue = sellerOrders.reduce((sum, order) => sum + order.total.amountCents, 0);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('addScreen.dashboardEyebrow')}
        title={currentSellerProfile.brandName}
        description={t('addScreen.dashboardDescription')}
      />
      <View style={styles.stats}>
        <StatCard label={t('sellerCenterScreen.listings')} value={String(sellerListings.length)} />
        <StatCard label={t('sellerCenterScreen.orders')} value={String(sellerOrders.length)} />
        <StatCard label={t('sellerCenterScreen.revenue')} value={formatMoney({ amountCents: revenue, currency: 'EUR' })} />
      </View>
      <View style={styles.actions}>
        <AppButton fullWidth label={t('common.createListing')} onPress={() => router.push('/listing/edit/new')} />
        <AppButton fullWidth label={t('common.openSellerCenter')} variant="secondary" onPress={() => router.push('/seller-center')} />
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
