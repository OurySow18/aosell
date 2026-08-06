import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { ThemedText } from '@/components/themed-text';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { DEFAULT_CITY } from '@/constants/location';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { getDeliveryModeLabel, getListingTypeLabel, getSellerTypeLabel } from '@/lib/i18n';
import { useAosell } from '@/providers/aosell-provider';

const toggleOptions = {
  type: ['all', 'product', 'meal', 'service'],
  deliveryMode: ['all', 'aosell', 'seller'],
  sellerType: ['all', 'shop', 'restaurant', 'individual'],
} as const;

const quickCities = [DEFAULT_CITY, 'Berlin', 'Hamburg', 'Munich'];

export default function SearchScreen() {
  const theme = useTheme();
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
    <AppScreen>
      <View style={[styles.searchShell, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, Shadows.card]}>
        <SymbolView
          tintColor={theme.text}
          size={22}
          name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder={t('searchScreen.queryPlaceholder')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          value={query}
        />
        <Pressable
          onPress={() => setShowFilters((current) => !current)}
          style={[styles.filterToggle, { backgroundColor: showFilters ? theme.accent : theme.backgroundSelected }]}>
          <SymbolView
            tintColor={theme.earth}
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
                  backgroundColor: active ? theme.text : theme.backgroundElement,
                  borderColor: active ? theme.text : theme.border,
                },
              ]}>
              <SymbolView
                tintColor={active ? theme.accent : theme.textSecondary}
                size={14}
                name={{ ios: 'location.fill', android: 'location_on', web: 'location_on' }}
              />
              <ThemedText type="button" style={{ color: active ? '#FFFFFF' : theme.text }}>
                {item}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
        {toggleOptions.type.map((option) => {
          const active = option === type;
          const color =
            option === 'meal'
              ? theme.coral
              : option === 'product'
                ? theme.violet
                : option === 'service'
                  ? theme.cyan
                  : theme.accent;
          return (
            <Pressable
              key={option}
              onPress={() => setType(option)}
              style={[
                styles.typeChip,
                {
                  backgroundColor: active ? color : theme.backgroundElement,
                  borderColor: active ? theme.text : theme.border,
                },
              ]}>
              <ThemedText type="button" style={{ color: active ? theme.earth : theme.text }}>
                {getListingTypeLabel(option)}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {showFilters ? (
        <View style={[styles.filterPanel, { backgroundColor: theme.text }]}>
          <View style={styles.filterPanelHeader}>
            <View>
              <ThemedText type="label" style={{ color: theme.accent }}>
                {t('searchScreen.refine')}
              </ThemedText>
              <ThemedText type="headline" style={{ color: '#FFFFFF' }}>
                {t('searchScreen.results', { count: results.length })}
              </ThemedText>
            </View>
            <Pressable onPress={() => setShowFilters(false)} style={styles.closeButton}>
              <SymbolView
                tintColor="#FFFFFF"
                size={18}
                name={{ ios: 'xmark', android: 'close', web: 'close' }}
              />
            </Pressable>
          </View>
          <FilterRow
            kind="deliveryMode"
            label={t('searchScreen.labels.delivery')}
            value={deliveryMode}
            options={toggleOptions.deliveryMode}
            onSelect={(value) =>
              setDeliveryMode(value as (typeof toggleOptions.deliveryMode)[number])
            }
          />
          <FilterRow
            kind="sellerType"
            label={t('searchScreen.labels.seller')}
            value={sellerType}
            options={toggleOptions.sellerType}
            onSelect={(value) => setSellerType(value as (typeof toggleOptions.sellerType)[number])}
          />
        </View>
      ) : null}

      <View style={styles.resultsHeader}>
        <ThemedText type="headline">{t('searchScreen.results', { count: results.length })}</ThemedText>
        <View style={[styles.resultDot, { backgroundColor: theme.accent }]} />
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
        <EmptyState title={t('searchScreen.noResultsTitle')} description={t('searchScreen.noResultsDescription')} />
      )}
    </AppScreen>
  );
}

function FilterRow({
  kind,
  label,
  options,
  value,
  onSelect,
}: {
  kind: 'deliveryMode' | 'sellerType';
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const renderOptionLabel = (option: string) =>
    kind === 'deliveryMode'
      ? getDeliveryModeLabel(option as 'all' | 'aosell' | 'seller')
      : getSellerTypeLabel(option as 'all' | 'shop' | 'restaurant' | 'individual');

  return (
    <View style={styles.filterRow}>
      <ThemedText type="label" style={{ color: '#B9B6C0' }}>
        {label}
      </ThemedText>
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
                  backgroundColor: active ? theme.accent : '#25252D',
                  borderColor: active ? theme.accent : '#3A3A44',
                },
              ]}>
              <ThemedText type="button" style={{ color: active ? theme.earth : '#FFFFFF' }}>
                {renderOptionLabel(option)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  searchShell: {
    minHeight: 64,
    borderWidth: 1.5,
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    minHeight: 58,
  },
  filterToggle: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityRow: {
    gap: Spacing.sm,
  },
  cityChip: {
    minHeight: 42,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeRow: {
    gap: Spacing.sm,
  },
  typeChip: {
    minHeight: 46,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPanel: {
    borderRadius: Radius.xlarge,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#3A3A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  darkFilter: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  resultDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  gridItem: {
    flexBasis: 300,
    flexGrow: 1,
    minWidth: 280,
  },
});
