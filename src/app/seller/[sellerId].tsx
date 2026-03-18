import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getSellerTypeLabel, getVerificationStatusLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function SellerProfileScreen() {
  const params = useLocalSearchParams<{ sellerId?: string | string[] }>();
  const sellerId = Array.isArray(params.sellerId) ? params.sellerId[0] : params.sellerId ?? '';
  const theme = useTheme();
  const { t } = useLocale();
  const { getSellerById, listings } = useAosell();
  const seller = getSellerById(sellerId);

  if (!seller) {
    return (
      <AppScreen>
        <EmptyState title={t('sellerProfileScreen.notFoundTitle')} description={t('sellerProfileScreen.notFoundDescription')} />
      </AppScreen>
    );
  }

  const sellerListings = listings.filter((listing) => listing.sellerId === seller.id && listing.status === 'active');

  return (
    <AppScreen>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SectionTitle eyebrow={t('sellerProfileScreen.eyebrow')} title={seller.brandName} description={seller.description} />
        <View style={styles.tags}>
          <StatusPill label={getSellerTypeLabel(seller.type)} tone="brand" />
          <StatusPill label={getVerificationStatusLabel(seller.verificationStatus)} tone="neutral" />
          <StatusPill label={`${seller.city}, ${seller.countryCode}`} tone="neutral" />
        </View>
        <AppButton label={t('sellerProfileScreen.searchMore')} variant="ghost" onPress={() => router.push('/search')} />
      </View>

      <ThemedText type="headline">{t('sellerProfileScreen.activeListings')}</ThemedText>
      <View style={styles.grid}>
        {sellerListings.map((listing) => (
          <View key={listing.id} style={styles.gridItem}>
            <ListingCard listing={listing} sellerName={seller.brandName} onPress={() => router.push(`/listing/${listing.id}`)} />
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
