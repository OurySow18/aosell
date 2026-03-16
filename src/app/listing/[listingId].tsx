import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { SellerCard } from '@/components/cards/seller-card';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{ listingId?: string | string[] }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId ?? '';
  const theme = useTheme();
  const { getListingById, getSellerById, addToCart } = useAosell();
  const [isAdding, setIsAdding] = useState(false);
  const listing = getListingById(listingId);

  if (!listing) {
    return (
      <AppScreen>
        <EmptyState title="Listing not found" description="The requested listing is missing or no longer active." />
      </AppScreen>
    );
  }

  const seller = getSellerById(listing.sellerId);

  async function handleAddToCart(forceReplace = false) {
    setIsAdding(true);
    const result = await addToCart(listing.id, forceReplace);
    setIsAdding(false);

    if (result.requiresAuth) {
      router.push('/auth');
      return;
    }

    if (result.requiresReplace) {
      Alert.alert('Replace cart?', 'AoSell V1 allows one seller per cart. Replace the current cart?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace',
          style: 'destructive',
          onPress: () => {
            void handleAddToCart(true);
          },
        },
      ]);
      return;
    }
    if (result.ok) {
      router.push('/cart');
    }
  }

  return (
    <AppScreen>
      <View style={[styles.media, { backgroundColor: theme.earth }]}>
        <StatusPill label={listing.type} tone="brand" />
        <View style={styles.mediaCopy}>
          <ThemedText type="display" style={{ color: theme.background }}>
            {listing.title}
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.background }}>
            Media carousel placeholder for V1: multiple images plus one optional video, no autoplay.
          </ThemedText>
        </View>
      </View>

      <View style={styles.summary}>
        <SectionTitle eyebrow="Listing detail" title={listing.title} description={listing.description} />
        <ThemedText type="display" style={{ color: theme.gold }}>
          {formatMoney(listing.price)}
        </ThemedText>
        <View style={styles.tags}>
          <StatusPill label={listing.deliveryMode} tone="neutral" />
          <StatusPill label={`${listing.city}, ${listing.countryCode}`} tone="neutral" />
          {listing.linkedVideoUrl ? <StatusPill label="Video included" tone="brand" /> : null}
        </View>
      </View>

      {seller ? <SellerCard seller={seller} onPress={() => router.push(`/seller/${seller.id}`)} /> : null}

      <View style={[styles.infoCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Delivery & order info</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          Delivery is handled by {listing.deliveryMode === 'aosell' ? 'AoSell' : 'the seller'}.
          Inventory follows the listing’s stock settings and can be expanded with Storage-backed media uploads.
        </ThemedText>
        <AppButton
          disabled={isAdding}
          label="Add to cart"
          onPress={() => {
            void handleAddToCart();
          }}
        />
        <AppButton
          disabled={isAdding}
          label="Order now"
          variant="secondary"
          onPress={() => {
            void handleAddToCart();
          }}
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  media: {
    borderRadius: Radius.large,
    padding: Spacing.xxl,
    minHeight: 280,
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  mediaCopy: {
    gap: Spacing.md,
    maxWidth: 560,
  },
  summary: {
    gap: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
});
