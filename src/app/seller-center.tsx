import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { StatCard } from '@/components/cards/stat-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function SellerCenterScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { currentUser, currentSellerProfile, listings, orders } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title={t('sellerCenterScreen.signInTitle')}
          description={t('sellerCenterScreen.signInDescription')}
        />
        <AppButton
          label={t('sellerCenterScreen.openAuth')}
          onPress={() =>
            router.replace({
              pathname: '/auth',
              params: {
                mode: 'signin',
                role: 'seller',
                returnTo: '/seller-center',
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
        <EmptyState
          title={t('sellerCenterScreen.createProfileTitle')}
          description={t('sellerCenterScreen.createProfileDescription')}
        />
        <AppButton label={t('sellerCenterScreen.startSellerSetup')} onPress={() => router.replace('/seller-onboarding')} />
      </AppScreen>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === currentSellerProfile.id);
  const sellerOrders = orders.filter((order) => order.sellerId === currentSellerProfile.id);
  const revenue = sellerOrders.reduce((total, order) => total + order.total.amountCents, 0);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('sellerCenterScreen.eyebrow')}
        title={currentSellerProfile.brandName}
        description={currentSellerProfile.description}
      />
      <View style={[styles.heroCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.heroGlow, { backgroundColor: theme.gold }]} />
        <View style={styles.heroTop}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
            <ThemedText type="title">{currentSellerProfile.brandName.slice(0, 2).toUpperCase()}</ThemedText>
          </View>
          <View style={styles.heroCopy}>
            <ThemedText type="title">{currentSellerProfile.brandName}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {currentSellerProfile.city}, {currentSellerProfile.countryCode}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.stats}>
        <StatCard label={t('sellerCenterScreen.listings')} value={String(sellerListings.length)} />
        <StatCard label={t('sellerCenterScreen.orders')} value={String(sellerOrders.length)} />
        <StatCard label={t('sellerCenterScreen.revenue')} value={formatMoney({ amountCents: revenue, currency: 'EUR' })} />
      </View>
      <AppButton fullWidth label={t('common.createListing')} onPress={() => router.push('/listing/edit/new')} />
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
  heroCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    opacity: 0.12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  heroCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
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
