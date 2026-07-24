import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ListingCard } from '@/components/cards/listing-card';
import { SellerCard } from '@/components/cards/seller-card';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel, getListingTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{
    intent?: string | string[];
    listingId?: string | string[];
  }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId ?? '';
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent;
  const theme = useTheme();
  const { t } = useLocale();
  const { currentUser, getListingById, getSellerById, addToCart, listings } = useAosell();
  const [isAdding, setIsAdding] = useState(false);
  const [didRecoverIntent, setDidRecoverIntent] = useState(false);
  const listing = getListingById(listingId);

  useEffect(() => {
    if (!currentUser || !listing || intent !== 'cart' || didRecoverIntent) {
      return;
    }

    setDidRecoverIntent(true);
    void handleAddToCart();
  }, [currentUser, didRecoverIntent, intent, listing?.id]);

  if (!listing) {
    return (
      <AppScreen>
        <EmptyState title={t('listingDetail.notFoundTitle')} description={t('listingDetail.notFoundDescription')} />
      </AppScreen>
    );
  }

  const seller = getSellerById(listing.sellerId);
  const moreFromSeller = listings
    .filter((item) => item.sellerId === listing.sellerId && item.id !== listing.id && item.status === 'active')
    .slice(0, 3);
  const primaryCategory = listing.categories[0] ?? t('listingDetail.general');
  const categoryText = listing.categories.length ? listing.categories.join(', ') : t('listingDetail.general');
  const tagText = listing.tags.length ? listing.tags.join(', ') : t('listingDetail.noTags');
  const stockLabel = listing.inventory.isUnlimited
    ? t('listingDetail.availableOnDemand')
    : t('listingDetail.leftCount', { count: listing.inventory.quantity ?? 0 });
  const ratingLabel = listing.averageRating
    ? t('listingDetail.reviews', { rating: listing.averageRating.toFixed(1), count: listing.reviewCount ?? 0 })
    : t('listingDetail.newListing');

  async function handleAddToCart(forceReplace = false) {
    setIsAdding(true);
    const result = await addToCart(listing.id, forceReplace);
    setIsAdding(false);

    if (result.requiresAuth) {
      router.push({
        pathname: '/auth',
        params: {
          mode: 'signup',
          role: 'buyer',
          returnTo: `/listing/${listing.id}?intent=cart`,
        },
      });
      return;
    }

    if (result.requiresReplace) {
      Alert.alert(t('listingDetail.replaceCartTitle'), t('listingDetail.replaceCartDescription'), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.replace'),
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
      <View style={styles.topSection}>
        <View style={styles.galleryColumn}>
          <ListingGallery listing={listing} />
        </View>

        <View
          style={[
            styles.summaryCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={[styles.summaryGlow, { backgroundColor: theme.gold }]} />
          <Pressable
            disabled={!seller}
            onPress={() => {
              if (seller) {
                router.push(`/seller/${seller.id}`);
              }
            }}
            style={[
              styles.storeStrip,
              { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
            ]}>
            <View
              style={[
                styles.storeAvatar,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText type="headline" style={{ color: theme.text }}>
                {(seller?.brandName ?? 'AS').slice(0, 2).toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.storeCopy}>
              <ThemedText type="button">{seller?.brandName ?? t('listingDetail.sellerFallback')}</ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {listing.city}, {listing.countryCode}
              </ThemedText>
            </View>
            <StatusPill label={getDeliveryModeLabel(listing.deliveryMode)} tone="neutral" />
          </Pressable>

          <View style={styles.tags}>
            <StatusPill label={getListingTypeLabel(listing.type)} tone="brand" />
            <StatusPill label={primaryCategory} tone="neutral" />
            {listing.linkedVideoUrl ? <StatusPill label={t('listingDetail.videoIncluded')} tone="warning" /> : null}
          </View>

          <View style={styles.summaryCopy}>
            <ThemedText type="title">{listing.title}</ThemedText>
            <ThemedText type="title" style={{ color: theme.forestGreen }}>
              {formatMoney(listing.price)}
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {listing.description}
            </ThemedText>
          </View>

          <View style={styles.quickMeta}>
            <View
              style={[
                styles.quickMetaCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <ThemedText type="label" themeColor="burntOrange">
                {t('listingDetail.delivery')}
              </ThemedText>
              <ThemedText type="headline">
                {listing.deliveryMode === 'aosell'
                  ? t('listingDetail.deliveryHandledByAosell')
                  : t('listingDetail.deliveryHandledBySeller')}
              </ThemedText>
            </View>
            <View
              style={[
                styles.quickMetaCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <ThemedText type="label" themeColor="burntOrange">
                {t('listingDetail.availability')}
              </ThemedText>
              <ThemedText type="headline">{stockLabel}</ThemedText>
            </View>
            <View
              style={[
                styles.quickMetaCard,
                { backgroundColor: theme.background, borderColor: theme.border },
              ]}>
              <ThemedText type="label" themeColor="burntOrange">
                {t('listingDetail.rating')}
              </ThemedText>
              <ThemedText type="headline">{ratingLabel}</ThemedText>
            </View>
          </View>

          <View style={[styles.buyCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <View style={styles.buyCopy}>
              <ThemedText type="headline">{t('listingDetail.readyToOrder')}</ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('listingDetail.readyDescription')}
              </ThemedText>
            </View>
            <AppButton
              disabled={isAdding}
              fullWidth
              label={t('common.addToCart')}
              onPress={() => {
                void handleAddToCart();
              }}
            />
            <AppButton
              disabled={isAdding}
              fullWidth
              label={t('common.orderNow')}
              variant="secondary"
              onPress={() => {
                void handleAddToCart();
              }}
            />
          </View>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="headline">{t('listingDetail.about')}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {listing.description}
          </ThemedText>
          <View style={styles.infoList}>
            <DetailLine
              label={t('listingDetail.published')}
              value={listing.publishedAt ? formatDate(listing.publishedAt) : formatDate(listing.createdAt)}
            />
            <DetailLine label={t('listingDetail.category')} value={categoryText} />
            <DetailLine label={t('listingDetail.tags')} value={tagText} />
          </View>
        </View>

        <View
          style={[
            styles.infoCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="headline">{t('listingDetail.deliveryDetails')}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {t('listingDetail.deliveryDetailsDescription', {
              who: listing.deliveryMode === 'aosell' ? 'AoSell' : t('auth.seller').toLowerCase(),
            })}
          </ThemedText>
          <View style={styles.infoList}>
            <DetailLine
              label={t('listingDetail.store')}
              value={seller ? `${seller.brandName}, ${seller.city}` : `${listing.city}, ${listing.countryCode}`}
            />
            <DetailLine
              label={t('common.delivery')}
              value={listing.deliveryMode === 'aosell' ? t('listingDetail.deliveryAvailableAosell') : t('listingDetail.deliveryAvailableSeller')}
            />
            <DetailLine label={t('listingDetail.checkout')} value={t('listingDetail.oneStorePerOrder')} />
          </View>
        </View>
      </View>

      {seller ? <SellerCard seller={seller} onPress={() => router.push(`/seller/${seller.id}`)} /> : null}

      {listing.attributes.length ? (
        <View
          style={[
            styles.attributeCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="headline">{t('listingDetail.itemDetails')}</ThemedText>
          <View style={styles.attributeList}>
            {listing.attributes.map((attribute) => (
              <View
                key={attribute.key}
                style={[
                  styles.attributeRow,
                  { backgroundColor: theme.background, borderColor: theme.border },
                ]}>
                <ThemedText type="label" themeColor="burntOrange">
                  {attribute.label}
                </ThemedText>
                <ThemedText type="body">{String(attribute.value)}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {moreFromSeller.length ? (
        <View style={styles.relatedSection}>
          <View style={styles.relatedCopy}>
            <ThemedText type="headline">{t('listingDetail.moreFromSeller', { seller: seller?.brandName ?? t('auth.seller').toLowerCase() })}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {t('listingDetail.moreFromSellerDescription')}
            </ThemedText>
          </View>
          <View style={styles.relatedGrid}>
            {moreFromSeller.map((item) => (
              <View key={item.id} style={styles.relatedItem}>
                <ListingCard
                  listing={item}
                  sellerName={seller?.brandName}
                  onPress={() => router.push(`/listing/${item.id}`)}
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailLine}>
      <ThemedText type="bodySmall" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="button">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  topSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xl,
  },
  galleryColumn: {
    flexBasis: 420,
    flexGrow: 1.2,
    minWidth: 300,
  },
  summaryCard: {
    flexBasis: 340,
    flexGrow: 1,
    minWidth: 280,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  summaryGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    opacity: 0.12,
  },
  storeStrip: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  storeAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  storeCopy: {
    gap: 2,
    flexBasis: 180,
    flexGrow: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  summaryCopy: {
    gap: Spacing.md,
  },
  quickMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickMetaCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
    flexBasis: 170,
    flexGrow: 1,
  },
  buyCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  buyCopy: {
    gap: Spacing.xs,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    flexBasis: 320,
    flexGrow: 1,
    minWidth: 280,
  },
  infoList: {
    gap: Spacing.sm,
  },
  detailLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  attributeCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  attributeList: {
    gap: Spacing.md,
  },
  attributeRow: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  relatedSection: {
    gap: Spacing.lg,
  },
  relatedCopy: {
    gap: Spacing.xs,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  relatedItem: {
    flexBasis: 320,
    flexGrow: 1,
    minWidth: 280,
  },
});
