import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/cards/listing-card';
import { SellerCard } from '@/components/cards/seller-card';
import { ListingGallery } from '@/components/listings/listing-gallery';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getDeliveryModeLabel, getListingTypeLabel } from '@/lib/i18n';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { useAosell } from '@/providers/aosell-provider';

type AppTheme = ReturnType<typeof useAppTheme>;

export default function ListingDetailScreen() {
  const params = useLocalSearchParams<{
    intent?: string | string[];
    listingId?: string | string[];
  }>();
  const listingId = Array.isArray(params.listingId) ? params.listingId[0] : params.listingId ?? '';
  const intent = Array.isArray(params.intent) ? params.intent[0] : params.intent;
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, getListingById, getSellerById, addToCart, listings } = useAosell();
  const [isAdding, setIsAdding] = useState(false);
  const [didRecoverIntent, setDidRecoverIntent] = useState(false);
  const listing = getListingById(listingId);

  async function handleAddToCart(forceReplace = false) {
    if (!listing) {
      return;
    }
    setIsAdding(true);
    const result = await addToCart(listing.id, forceReplace);
    setIsAdding(false);

    if (result.requiresAuth) {
      router.push({
        pathname: '/auth',
        params: { mode: 'signup', role: 'buyer', returnTo: `/listing/${listing.id}?intent=cart` },
      });
      return;
    }

    if (result.requiresReplace) {
      Alert.alert(t('listingDetail.replaceCartTitle'), t('listingDetail.replaceCartDescription'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.replace'), style: 'destructive', onPress: () => void handleAddToCart(true) },
      ]);
      return;
    }

    if (result.ok) {
      router.push('/cart');
    }
  }

  useEffect(() => {
    if (!currentUser || !listing || intent !== 'cart' || didRecoverIntent) {
      return;
    }
    setDidRecoverIntent(true);
    void handleAddToCart();
  }, [currentUser, didRecoverIntent, intent, listing?.id]);

  if (!listing) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.notFoundTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('listingDetail.notFoundTitle')}
        </Text>
        <Text style={[styles.notFoundBody, { color: theme.colors.textMuted }]}>{t('listingDetail.notFoundDescription')}</Text>
      </SafeAreaView>
    );
  }

  const seller = getSellerById(listing.sellerId);
  const moreFromSeller = listings
    .filter((item) => item.sellerId === listing.sellerId && item.id !== listing.id && item.status === 'active')
    .slice(0, 3);
  const categoryText = listing.categories.length ? listing.categories.join(', ') : t('listingDetail.general');
  const tagText = listing.tags.length ? listing.tags.join(', ') : t('listingDetail.noTags');
  const stockLabel = listing.inventory.isUnlimited
    ? t('listingDetail.availableOnDemand')
    : t('listingDetail.leftCount', { count: listing.inventory.quantity ?? 0 });
  const ratingLabel = listing.averageRating
    ? t('listingDetail.reviews', { rating: listing.averageRating.toFixed(1), count: listing.reviewCount ?? 0 })
    : t('listingDetail.newListing');

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing[8] }]} showsVerticalScrollIndicator={false}>
        <ListingGallery listing={listing} />

        <View style={styles.storeStripWrap}>
          <Pressable
            disabled={!seller}
            onPress={() => {
              if (seller) {
                router.push(`/seller/${seller.id}`);
              }
            }}
            style={[
              styles.storeStrip,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
            ]}>
            <View style={[styles.storeAvatar, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
              <Text style={[styles.storeAvatarText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {(seller?.brandName ?? 'AS').slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.storeCopy}>
              <Text style={[styles.storeName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
                {seller?.brandName ?? t('listingDetail.sellerFallback')}
              </Text>
              <Text style={[styles.storeMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {listing.city}, {listing.countryCode}
              </Text>
            </View>
            <View style={[styles.deliveryPill, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill }]}>
              <Text style={[styles.deliveryPillText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
                {getDeliveryModeLabel(listing.deliveryMode)}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.tags}>
            <Pill label={getListingTypeLabel(listing.type)} tone="accent" theme={theme} />
            {listing.categories[0] ? <Pill label={listing.categories[0]} tone="neutral" theme={theme} /> : null}
            {listing.linkedVideoUrl ? <Pill label={t('listingDetail.videoIncluded')} tone="warning" theme={theme} /> : null}
          </View>

          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>{listing.title}</Text>
          <Text style={[styles.price, { color: theme.colors.success, fontFamily: theme.typography.title.fontFamily }]}>
            {formatMoney(listing.price)}
          </Text>
          <Text style={[styles.description, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
            {listing.description}
          </Text>
        </View>

        <View style={[styles.quickMetaBand, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
          <QuickMetaCell
            label={t('listingDetail.delivery')}
            value={listing.deliveryMode === 'aosell' ? t('listingDetail.deliveryHandledByAosell') : t('listingDetail.deliveryHandledBySeller')}
            theme={theme}
          />
          <View style={[styles.quickMetaDivider, { backgroundColor: theme.colors.border }]} />
          <QuickMetaCell label={t('listingDetail.availability')} value={stockLabel} theme={theme} />
          <View style={[styles.quickMetaDivider, { backgroundColor: theme.colors.border }]} />
          <QuickMetaCell label={t('listingDetail.rating')} value={ratingLabel} theme={theme} />
        </View>

        <View style={[styles.buyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
          <View style={styles.buyCopy}>
            <Text style={[styles.buyTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('listingDetail.readyToOrder')}
            </Text>
            <Text style={[styles.buyDescription, { color: theme.colors.textMuted }]}>{t('listingDetail.readyDescription')}</Text>
          </View>
          <Pressable
            disabled={isAdding}
            onPress={() => void handleAddToCart()}
            style={[
              styles.primaryButton,
              { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, opacity: isAdding ? theme.motion.disabledOpacity : 1 },
            ]}>
            <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent, fontFamily: theme.typography.label.fontFamily }]}>
              {t('common.addToCart')}
            </Text>
          </Pressable>
          <Pressable
            disabled={isAdding}
            onPress={() => void handleAddToCart()}
            style={[
              styles.secondaryButton,
              { borderColor: theme.colors.text, borderRadius: theme.radii.md, opacity: isAdding ? theme.motion.disabledOpacity : 1 },
            ]}>
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {t('common.orderNow')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoGrid}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('listingDetail.about')}
            </Text>
            <Text style={[styles.infoBody, { color: theme.colors.textMuted }]}>{listing.description}</Text>
            <View style={styles.infoList}>
              <DetailLine
                label={t('listingDetail.published')}
                value={listing.publishedAt ? formatDate(listing.publishedAt) : formatDate(listing.createdAt)}
                theme={theme}
              />
              <DetailLine label={t('listingDetail.category')} value={categoryText} theme={theme} />
              <DetailLine label={t('listingDetail.tags')} value={tagText} theme={theme} />
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('listingDetail.deliveryDetails')}
            </Text>
            <Text style={[styles.infoBody, { color: theme.colors.textMuted }]}>
              {t('listingDetail.deliveryDetailsDescription', {
                who: listing.deliveryMode === 'aosell' ? 'AoSell' : t('auth.seller').toLowerCase(),
              })}
            </Text>
            <View style={styles.infoList}>
              <DetailLine
                label={t('listingDetail.store')}
                value={seller ? `${seller.brandName}, ${seller.city}` : `${listing.city}, ${listing.countryCode}`}
                theme={theme}
              />
              <DetailLine
                label={t('common.delivery')}
                value={listing.deliveryMode === 'aosell' ? t('listingDetail.deliveryAvailableAosell') : t('listingDetail.deliveryAvailableSeller')}
                theme={theme}
              />
              <DetailLine label={t('listingDetail.checkout')} value={t('listingDetail.oneStorePerOrder')} theme={theme} />
            </View>
          </View>
        </View>

        {seller ? <SellerCard seller={seller} onPress={() => router.push(`/seller/${seller.id}`)} /> : null}

        {listing.attributes.length ? (
          <View style={[styles.attributeCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.infoTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('listingDetail.itemDetails')}
            </Text>
            <View style={styles.attributeList}>
              {listing.attributes.map((attribute) => (
                <View
                  key={attribute.key}
                  style={[styles.attributeRow, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
                  <Text style={[styles.attributeLabel, { color: theme.colors.accent, fontFamily: theme.typography.micro.fontFamily }]}>
                    {attribute.label}
                  </Text>
                  <Text style={[styles.attributeValue, { color: theme.colors.text }]}>{String(attribute.value)}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {moreFromSeller.length ? (
          <View style={styles.relatedSection}>
            <View style={styles.relatedCopy}>
              <Text style={[styles.infoTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {t('listingDetail.moreFromSeller', { seller: seller?.brandName ?? t('auth.seller').toLowerCase() })}
              </Text>
              <Text style={[styles.infoBody, { color: theme.colors.textMuted }]}>{t('listingDetail.moreFromSellerDescription')}</Text>
            </View>
            <View style={styles.relatedGrid}>
              {moreFromSeller.map((item) => (
                <View key={item.id} style={styles.relatedItem}>
                  <ListingCard listing={item} sellerName={seller?.brandName} onPress={() => router.push(`/listing/${item.id}`)} />
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Pill({ label, tone, theme }: { label: string; tone: 'accent' | 'neutral' | 'warning'; theme: AppTheme }) {
  const backgroundColor = tone === 'accent' ? theme.colors.accent : tone === 'warning' ? theme.colors.warning : theme.colors.surfaceMuted;
  const color = tone === 'accent' ? theme.colors.onAccent : tone === 'warning' ? '#FFFFFF' : theme.colors.text;
  return (
    <View style={[styles.pill, { backgroundColor, borderRadius: theme.radii.pill }]}>
      <Text style={[styles.pillText, { color, fontFamily: theme.typography.label.fontFamily }]}>{label}</Text>
    </View>
  );
}

function QuickMetaCell({ label, value, theme }: { label: string; value: string; theme: AppTheme }) {
  return (
    <View style={styles.quickMetaCell}>
      <Text style={[styles.quickMetaLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.quickMetaValue, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function DetailLine({ label, value, theme }: { label: string; value: string; theme: AppTheme }) {
  return (
    <View style={styles.detailLine}>
      <Text style={[styles.detailLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  notFoundTitle: { fontSize: 17, lineHeight: 24 },
  notFoundBody: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  storeStripWrap: {},
  storeStrip: { borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  storeAvatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  storeAvatarText: { fontSize: 15, lineHeight: 20 },
  storeCopy: { gap: 2, flexBasis: 140, flexGrow: 1 },
  storeName: { fontSize: 15, lineHeight: 20 },
  storeMeta: { fontSize: 13, lineHeight: 18 },
  deliveryPill: { paddingHorizontal: 10, paddingVertical: 7 },
  deliveryPillText: { fontSize: 11, lineHeight: 14 },

  summarySection: { gap: 10 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { paddingHorizontal: 12, paddingVertical: 7 },
  pillText: { fontSize: 13, lineHeight: 18 },
  title: { fontSize: 22, lineHeight: 28 },
  price: { fontSize: 22, lineHeight: 28 },
  description: { fontSize: 15, lineHeight: 22 },

  quickMetaBand: { flexDirection: 'row', borderWidth: 1, overflow: 'hidden' },
  quickMetaCell: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 6 },
  quickMetaDivider: { width: 1 },
  quickMetaLabel: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  quickMetaValue: { fontSize: 15, lineHeight: 20, textAlign: 'center' },

  buyCard: { borderWidth: 1, padding: 16, gap: 12 },
  buyCopy: { gap: 4 },
  buyTitle: { fontSize: 17, lineHeight: 22 },
  buyDescription: { fontSize: 13, lineHeight: 18 },
  primaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontSize: 15, lineHeight: 20 },
  secondaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  secondaryButtonText: { fontSize: 15, lineHeight: 20 },

  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoCard: { borderWidth: 1, padding: 16, gap: 12, flexBasis: 320, flexGrow: 1, minWidth: 280 },
  infoTitle: { fontSize: 17, lineHeight: 22 },
  infoBody: { fontSize: 14, lineHeight: 20 },
  infoList: { gap: 8 },
  detailLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  detailLabel: { fontSize: 13, lineHeight: 18 },
  detailValue: { fontSize: 14, lineHeight: 20 },

  attributeCard: { borderWidth: 1, padding: 16, gap: 12 },
  attributeList: { gap: 10 },
  attributeRow: { borderWidth: 1, padding: 12, gap: 3 },
  attributeLabel: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  attributeValue: { fontSize: 15, lineHeight: 20 },

  relatedSection: { gap: 12 },
  relatedCopy: { gap: 4 },
  relatedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  relatedItem: { flexBasis: 300, flexGrow: 1, minWidth: 260 },
});
