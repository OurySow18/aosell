import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/cards/listing-card';
import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getCuisineLabel, getDeliveryModeLabel, getListingTypeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { useAosell } from '@/providers/aosell-provider';
import type { Cuisine, Listing, SellerProfile } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

const toggleOptions = {
  type: ['all', 'product', 'meal', 'service'],
  deliveryMode: ['all', 'aosell', 'seller'],
  sellerType: ['all', 'shop', 'restaurant', 'individual'],
} as const;

const quickCities = [DEFAULT_CITY, 'Berlin', 'Hamburg', 'Munich'];

export default function SearchScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { searchListings, sellers, listings, getSellerById, addToCart } = useAosell();
  const params = useLocalSearchParams<{ type?: string; deliveryMode?: string }>();
  const initialType = toggleOptions.type.includes(params.type as (typeof toggleOptions.type)[number])
    ? (params.type as (typeof toggleOptions.type)[number])
    : 'all';
  const initialDelivery = toggleOptions.deliveryMode.includes(
    params.deliveryMode as (typeof toggleOptions.deliveryMode)[number],
  )
    ? (params.deliveryMode as (typeof toggleOptions.deliveryMode)[number])
    : 'all';
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof toggleOptions.type)[number]>(initialType);
  const [deliveryMode, setDeliveryMode] =
    useState<(typeof toggleOptions.deliveryMode)[number]>(initialDelivery);
  const [sellerType, setSellerType] = useState<(typeof toggleOptions.sellerType)[number]>('all');
  const [countryCode] = useState('DE');
  const [city, setCity] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | 'all'>('all');
  const [addingListingId, setAddingListingId] = useState<string | null>(null);

  const results = searchListings({ query, type, deliveryMode, sellerType, countryCode, city });

  const availableCuisines = Array.from(new Set(sellers.flatMap((seller) => seller.cuisineSpecialties)));
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
        <Text style={[styles.discoverTitle, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
          {t('tabs.search')}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          <DiscoverChip label={t('common.all')} active={selectedCuisine === 'all'} onPress={() => setSelectedCuisine('all')} theme={theme} />
          {availableCuisines.map((cuisine) => (
            <DiscoverChip
              key={cuisine}
              label={getCuisineLabel(cuisine)}
              active={selectedCuisine === cuisine}
              onPress={() => setSelectedCuisine(cuisine)}
              theme={theme}
            />
          ))}
        </ScrollView>

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

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('home.nearby')}
          </Text>
        </View>

        <View style={styles.nearbyList}>
          {nearbySellers.map((seller) => (
            <NearbyRow key={seller.id} seller={seller} theme={theme} />
          ))}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View
          style={[
            styles.searchShell,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
            theme.shadows.sm,
          ]}>
          <SymbolView tintColor={theme.colors.text} size={22} name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder={t('searchScreen.queryPlaceholder')}
            placeholderTextColor={theme.colors.textMuted}
            style={[styles.searchInput, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}
            value={query}
          />
          <Pressable
            onPress={() => setShowFilters((current) => !current)}
            style={[
              styles.filterToggle,
              {
                backgroundColor: showFilters ? theme.colors.accent : theme.colors.surfaceMuted,
                borderRadius: theme.radii.md,
              },
            ]}>
            <SymbolView
              tintColor={showFilters ? theme.colors.onAccent : theme.colors.text}
              size={19}
              name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
            />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
          {quickCities.map((item) => {
            const active = city.toLowerCase() === item.toLowerCase();
            return (
              <Pressable
                key={item}
                onPress={() => setCity(active ? '' : item)}
                style={[
                  styles.cityChip,
                  {
                    borderRadius: theme.radii.pill,
                    backgroundColor: active ? theme.colors.text : theme.colors.surface,
                    borderColor: active ? theme.colors.text : theme.colors.border,
                  },
                ]}>
                <SymbolView
                  tintColor={active ? theme.colors.background : theme.colors.textMuted}
                  size={14}
                  name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
                />
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? theme.colors.background : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
                  ]}>
                  {item}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
          {toggleOptions.type.map((option) => {
            const active = option === type;
            const color =
              option === 'meal'
                ? theme.colors.secondary
                : option === 'product'
                  ? theme.colors.warning
                  : option === 'service'
                    ? theme.colors.success
                    : theme.colors.text;
            // Coral (secondary) text must always be ink, never white (design rule).
            // "all" uses theme.colors.text as its background, which flips light/dark
            // per theme, so its label must flip with it (background) rather than a
            // fixed white that would be invisible in dark mode.
            const textColor = option === 'meal' ? theme.colors.text : option === 'all' ? theme.colors.background : '#FFFFFF';
            return (
              <Pressable
                key={option}
                onPress={() => setType(option)}
                style={[
                  styles.typeChip,
                  {
                    borderRadius: theme.radii.md,
                    backgroundColor: active ? color : theme.colors.surface,
                    borderColor: active ? color : theme.colors.border,
                  },
                ]}>
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? textColor : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
                  ]}>
                  {getListingTypeLabel(option)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {showFilters ? (
          <View style={[styles.filterPanel, { backgroundColor: theme.colors.text, borderRadius: theme.radii.sheet }]}>
            <View style={styles.filterPanelHeader}>
              <View>
                <Text style={[styles.eyebrow, { color: theme.colors.accent, fontFamily: theme.typography.caption.fontFamily }]}>
                  {t('searchScreen.refine')}
                </Text>
                <Text style={[styles.filterTitle, { color: theme.colors.background, fontFamily: theme.typography.heading.fontFamily }]}>
                  {t('searchScreen.results', { count: results.length })}
                </Text>
              </View>
              <Pressable
                onPress={() => setShowFilters(false)}
                style={[styles.closeButton, { borderRadius: theme.radii.pill, borderColor: 'rgba(255,255,255,0.24)' }]}>
                <SymbolView tintColor={theme.colors.background} size={18} name={{ ios: 'xmark', android: 'close', web: 'close' }} />
              </Pressable>
            </View>
            <FilterRow
              theme={theme}
              kind="deliveryMode"
              label={t('searchScreen.labels.delivery')}
              value={deliveryMode}
              options={toggleOptions.deliveryMode}
              onSelect={(value) => setDeliveryMode(value as (typeof toggleOptions.deliveryMode)[number])}
            />
            <FilterRow
              theme={theme}
              kind="sellerType"
              label={t('searchScreen.labels.seller')}
              value={sellerType}
              options={toggleOptions.sellerType}
              onSelect={(value) => setSellerType(value as (typeof toggleOptions.sellerType)[number])}
            />
          </View>
        ) : null}

        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('searchScreen.results', { count: results.length })}
          </Text>
          <View style={[styles.resultDot, { backgroundColor: theme.colors.accent }]} />
        </View>

        {results.length ? (
          <View style={styles.grid}>
            {results.map((listing) => (
              <View key={listing.id} style={styles.gridItem}>
                <ListingCard
                  listing={listing}
                  sellerName={sellers.find((seller) => seller.id === listing.sellerId)?.brandName}
                  onPress={() => router.push(`/listing/${listing.id}`)}
                />
              </View>
            ))}
          </View>
        ) : (
          <View
            style={[
              styles.emptyState,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
            ]}>
            <Text style={[styles.emptyTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('searchScreen.noResultsTitle')}
            </Text>
            <Text style={[styles.emptyDescription, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {t('searchScreen.noResultsDescription')}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DiscoverChip({
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
        styles.discoverChip,
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
          style={[styles.spotlightAddButton, { backgroundColor: theme.colors.accent, opacity: isAdding ? theme.motion.disabledOpacity : 1 }, theme.shadows.accent]}>
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

function FilterRow({
  theme,
  kind,
  label,
  options,
  value,
  onSelect,
}: {
  theme: AppTheme;
  kind: 'deliveryMode' | 'sellerType';
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const renderOptionLabel = (option: string) =>
    kind === 'deliveryMode'
      ? getDeliveryModeLabel(option as 'all' | 'aosell' | 'seller')
      : getSellerTypeLabel(option as 'all' | 'shop' | 'restaurant' | 'individual');

  return (
    <View style={styles.filterRow}>
      <Text style={[styles.filterRowLabel, { color: 'rgba(255,255,255,0.6)', fontFamily: theme.typography.caption.fontFamily }]}>
        {label}
      </Text>
      <View style={styles.filterOptions}>
        {options.map((option) => {
          const active = option === value;
          return (
            <Pressable
              key={option}
              onPress={() => onSelect(option)}
              style={[
                styles.darkFilter,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: active ? theme.colors.accent : 'rgba(255,255,255,0.08)',
                  borderColor: active ? theme.colors.accent : 'rgba(255,255,255,0.16)',
                },
              ]}>
              <Text
                style={[
                  styles.chipLabel,
                  { color: active ? theme.colors.onAccent : '#FFFFFF', fontFamily: theme.typography.label.fontFamily },
                ]}>
                {renderOptionLabel(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, gap: 16 },

  discoverTitle: { fontSize: 28, lineHeight: 34 },
  chipRow: { gap: 8, paddingRight: 20 },
  discoverChip: { height: 36, borderRadius: 18, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, lineHeight: 24, marginTop: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },

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
  spotlightAddButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 13, lineHeight: 18 },

  nearbyList: { marginTop: 14, gap: 14 },
  nearbyRow: { flexDirection: 'row', gap: 12 },
  nearbyThumb: { width: 76, height: 76, borderRadius: 12, overflow: 'hidden' },
  nearbyInfo: { flex: 1, justifyContent: 'center', gap: 3 },
  nearbyName: { fontSize: 15, lineHeight: 20 },
  nearbyBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  badgeText: { fontSize: 11, lineHeight: 14 },

  divider: { height: StyleSheet.hairlineWidth, marginTop: 8 },

  searchShell: { minHeight: 60, borderWidth: 1, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  searchInput: { flex: 1, fontSize: 15, minHeight: 56 },
  filterToggle: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cityRow: { gap: 8 },
  cityChip: { minHeight: 40, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeRow: { gap: 8 },
  typeChip: { minHeight: 44, borderWidth: 1, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontSize: 13, lineHeight: 18 },
  filterPanel: { padding: 20, gap: 16 },
  filterPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  eyebrow: { fontSize: 11, lineHeight: 14, letterSpacing: 0.3, textTransform: 'uppercase' },
  filterTitle: { fontSize: 17, lineHeight: 22, marginTop: 4 },
  closeButton: { width: 38, height: 38, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: { gap: 8 },
  filterRowLabel: { fontSize: 13, lineHeight: 18 },
  filterOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  darkFilter: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsTitle: { fontSize: 17, lineHeight: 22 },
  resultDot: { width: 8, height: 8, borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  gridItem: { flexBasis: 300, flexGrow: 1, minWidth: 280 },
  emptyState: { borderWidth: 1, padding: 24, gap: 8 },
  emptyTitle: { fontSize: 17, lineHeight: 22 },
  emptyDescription: { fontSize: 14, lineHeight: 20 },
});
