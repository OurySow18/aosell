import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListingCard } from '@/components/cards/listing-card';
import { DEFAULT_CITY } from '@/constants/location';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getDeliveryModeLabel, getListingTypeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { useAosell } from '@/providers/aosell-provider';

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
  const { searchListings, sellers } = useAosell();
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

  const results = searchListings({ query, type, deliveryMode, sellerType, countryCode, city });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: theme.spacing[8] }]}
        showsVerticalScrollIndicator={false}>
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
                    : theme.colors.accent;
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
                    { color: active ? '#FFFFFF' : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
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
