import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getCuisineLabel, getDeliveryModeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import type { Cuisine, Listing, SellerProfile } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

export default function HomeScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, addresses, sellers, listings, notifications, getSellerById, addToCart } = useAosell();

  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | 'all'>('all');
  const [addingListingId, setAddingListingId] = useState<string | null>(null);

  const availableCuisines = Array.from(new Set(sellers.flatMap((seller) => seller.cuisineSpecialties)));
  const hasUnreadNotifications = notifications.some((item) => !item.isRead);

  const defaultAddress = addresses.find((item) => item.isDefault) ?? addresses[0];
  const addressLabel = defaultAddress ? `${defaultAddress.line1}, ${defaultAddress.city}` : DEFAULT_CITY;

  const cuisineFilteredListings =
    selectedCuisine === 'all'
      ? listings
      : listings.filter((listing) => getSellerById(listing.sellerId)?.cuisineSpecialties.includes(selectedCuisine));
  const mealListings = cuisineFilteredListings.filter((listing) => listing.type === 'meal');
  const spotlight = mealListings.find((listing) => listing.isFeatured) ?? mealListings[0];
  const spotlightSeller = spotlight ? getSellerById(spotlight.sellerId) : undefined;

  const nearbySellers =
    selectedCuisine === 'all' ? sellers.slice(0, 6) : sellers.filter((seller) => seller.cuisineSpecialties.includes(selectedCuisine));

  async function handleAddSpotlight() {
    if (!spotlight) {
      return;
    }
    setAddingListingId(spotlight.id);
    const result = await addToCart(spotlight.id);
    setAddingListingId(null);

    if (result.requiresAuth) {
      router.push({ pathname: '/auth', params: { mode: 'signup', role: 'buyer' } });
      return;
    }
    if (result.ok) {
      router.push('/cart');
    }
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing[8] }]}
        showsVerticalScrollIndicator={false}>
        {/* 1. En-tête */}
        <View style={styles.headerRow}>
          <Pressable style={styles.addressBlock}>
            <Text style={[styles.muted, { color: theme.colors.textMuted, fontFamily: theme.typography.caption.fontFamily }]}>
              {t('home.deliverTo')}
            </Text>
            <View style={styles.addressLine}>
              <Text
                numberOfLines={1}
                style={[styles.addressText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {addressLabel}
              </Text>
              <SymbolView
                tintColor={theme.colors.text}
                size={18}
                name={{ ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' }}
              />
            </View>
          </Pressable>

          <Pressable
            accessibilityLabel={t('common.notifications')}
            onPress={() => router.push('/notifications')}
            style={[styles.bellButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'bell', android: 'notifications', web: 'notifications' }} />
            {hasUnreadNotifications ? (
              <View style={[styles.bellDot, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.surface }]} />
            ) : null}
          </Pressable>
        </View>

        {/* 2. Recherche */}
        <Pressable
          onPress={() => router.push('/search')}
          style={[styles.searchBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
          <SymbolView tintColor={theme.colors.textMuted} size={20} name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
          <Text style={[styles.searchPlaceholder, { color: theme.colors.textMuted }]}>{t('home.searchPlaceholder')}</Text>
          <SymbolView
            tintColor={theme.colors.text}
            size={20}
            name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
          />
        </Pressable>

        {/* 3. Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <Chip label={t('common.all')} active={selectedCuisine === 'all'} onPress={() => setSelectedCuisine('all')} theme={theme} />
          {availableCuisines.map((cuisine) => (
            <Chip
              key={cuisine}
              label={getCuisineLabel(cuisine)}
              active={selectedCuisine === cuisine}
              onPress={() => setSelectedCuisine(cuisine)}
              theme={theme}
            />
          ))}
        </ScrollView>

        {/* 4-5. Plat du moment */}
        {spotlight ? (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('home.featuredDish')}
            </Text>
            <SpotlightCard
              listing={spotlight}
              sellerName={spotlightSeller?.brandName}
              isAdding={addingListingId === spotlight.id}
              onAdd={() => void handleAddSpotlight()}
              theme={theme}
              t={t}
            />
          </>
        ) : null}

        {/* 6. À proximité */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('home.nearby')}
          </Text>
          <Pressable onPress={() => router.push('/search')}>
            <Text
              style={[
                styles.textButton,
                { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily },
              ]}>
              {t('home.viewAll')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.nearbyList}>
          {nearbySellers.map((seller) => (
            <NearbyRow key={seller.id} seller={seller} theme={theme} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  active,
  onPress,
  theme,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? theme.colors.accentTint : theme.colors.surface,
          borderColor: active ? theme.colors.accent : theme.colors.border,
          borderWidth: active ? 1.5 : 1,
        },
      ]}>
      <Text style={[styles.chipLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{label}</Text>
    </Pressable>
  );
}

function SpotlightCard({
  listing,
  sellerName,
  isAdding,
  onAdd,
  theme,
  t,
}: {
  listing: Listing;
  sellerName?: string;
  isAdding: boolean;
  onAdd: () => void;
  theme: AppTheme;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const image = getPrimaryListingImage(listing);
  const discountPct = listing.compareAtPrice
    ? Math.round((1 - listing.price.amountCents / listing.compareAtPrice.amountCents) * 100)
    : undefined;
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <View
      style={[
        styles.spotlightCard,
        { backgroundColor: theme.colors.surface, borderRadius: theme.radii.xl },
        theme.dark ? { borderWidth: 1, borderColor: theme.colors.border } : theme.shadows.md,
      ]}>
      <View style={[styles.spotlightMedia, { backgroundColor: theme.colors.accentTint }]}>
        {image?.url ? <Image contentFit="cover" source={{ uri: image.url }} style={StyleSheet.absoluteFillObject} transition={200} /> : null}

        {discountPct && discountPct > 0 ? (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.secondary }]}>
            <Text style={[styles.discountBadgeText, { color: theme.colors.onSecondary, fontFamily: theme.typography.micro.fontFamily }]}>
              −{discountPct}%
            </Text>
          </View>
        ) : null}

        <Pressable
          accessibilityLabel={t('common.favorite')}
          onPress={() => setIsFavorite((current) => !current)}
          style={[styles.favoriteButton, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
          <SymbolView
            tintColor={isFavorite ? theme.colors.secondaryStrong : theme.colors.text}
            size={18}
            name={isFavorite ? { ios: 'heart.fill', android: 'favorite', web: 'favorite' } : { ios: 'heart', android: 'favorite_border', web: 'favorite_border' }}
          />
        </Pressable>
      </View>

      <View style={styles.spotlightBody}>
        <View style={styles.spotlightInfo}>
          <Text style={[styles.spotlightTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {listing.title}
          </Text>
          {sellerName ? <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{sellerName}</Text> : null}

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: theme.colors.secondaryText, fontFamily: theme.typography.heading.fontFamily }]}>
              {formatMoney(listing.price)}
            </Text>
            {listing.compareAtPrice ? (
              <Text style={[styles.comparePrice, { color: theme.colors.textMuted }]}>{formatMoney(listing.compareAtPrice)}</Text>
            ) : null}
          </View>

          <View style={styles.metaRow}>
            <SymbolView tintColor={theme.colors.textMuted} size={14} name={{ ios: 'clock', android: 'schedule', web: 'schedule' }} />
            <Text style={[styles.muted, { color: theme.colors.textMuted }]}>{getDeliveryModeLabel(listing.deliveryMode)}</Text>
          </View>
        </View>

        <Pressable
          accessibilityLabel={t('common.addToCart')}
          disabled={isAdding}
          onPress={onAdd}
          style={[styles.addButton, { backgroundColor: theme.colors.accent, opacity: isAdding ? theme.motion.disabledOpacity : 1 }, theme.shadows.accent]}>
          <SymbolView tintColor={theme.colors.onAccent} size={22} name={{ ios: 'plus', android: 'add', web: 'add' }} />
        </Pressable>
      </View>
    </View>
  );
}

function NearbyRow({ seller, theme }: { seller: SellerProfile; theme: AppTheme }) {
  const cuisineLabel = seller.cuisineSpecialties[0] ? getCuisineLabel(seller.cuisineSpecialties[0]) : undefined;

  return (
    <Pressable onPress={() => router.push(`/seller/${seller.id}`)} style={styles.nearbyRow}>
      <View style={[styles.nearbyThumb, { backgroundColor: theme.colors.accentTint }]}>
        {seller.coverImageUrl ? (
          <Image contentFit="cover" source={{ uri: seller.coverImageUrl }} style={StyleSheet.absoluteFillObject} transition={200} />
        ) : null}
      </View>
      <View style={styles.nearbyInfo}>
        <Text style={[styles.nearbyName, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {seller.brandName}
        </Text>
        <Text style={[styles.muted, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {[cuisineLabel, seller.city].filter(Boolean).join(' · ')}
        </Text>
        <View style={styles.nearbyBadges}>
          {seller.ratingAverage ? (
            <View style={[styles.badge, { backgroundColor: theme.colors.accentTint }]}>
              <Text style={[styles.badgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
                ★ {seller.ratingAverage.toFixed(1)}
              </Text>
            </View>
          ) : null}
          <View style={[styles.badge, { backgroundColor: theme.colors.surfaceMuted }]}>
            <Text style={[styles.badgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
              {seller.deliveryModes.map((mode) => getDeliveryModeLabel(mode)).join(' + ')}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingTop: 6, paddingHorizontal: 20, gap: 4 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  addressBlock: { flex: 1, gap: 2 },
  addressLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 17, lineHeight: 24, flexShrink: 1 },
  muted: { fontSize: 13, lineHeight: 18 },
  bellButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bellDot: { position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, borderWidth: 2 },

  searchBar: {
    marginTop: 16,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchPlaceholder: { flex: 1, fontSize: 15 },

  chipRow: { marginTop: 16, gap: 8, paddingRight: 20 },
  chip: { height: 36, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 13, lineHeight: 18 },

  sectionTitle: { fontSize: 17, lineHeight: 24, marginTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 28 },
  textButton: { fontSize: 13, lineHeight: 18, textDecorationLine: 'underline' },

  spotlightCard: { marginTop: 12, overflow: 'hidden' },
  spotlightMedia: { height: 168 },
  discountBadge: { position: 'absolute', left: 12, top: 12, borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4 },
  discountBadgeText: { fontSize: 11, lineHeight: 14 },
  favoriteButton: { position: 'absolute', right: 12, top: 12, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  spotlightBody: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, padding: 14 },
  spotlightInfo: { flex: 1, gap: 4 },
  spotlightTitle: { fontSize: 17, lineHeight: 24 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 4 },
  price: { fontSize: 17, lineHeight: 24 },
  comparePrice: { fontSize: 13, lineHeight: 18, textDecorationLine: 'line-through' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  addButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  nearbyList: { marginTop: 14, gap: 14 },
  nearbyRow: { flexDirection: 'row', gap: 12 },
  nearbyThumb: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden' },
  nearbyInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  nearbyName: { fontSize: 15, lineHeight: 20 },
  nearbyBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 11, lineHeight: 14 },
});
