import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import {
  getDeliveryModeLabel,
  getListingTypeLabel,
  getSellerTypeLabel,
} from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

const toggleOptions = {
  type: ['all', 'product', 'meal', 'service'],
  deliveryMode: ['all', 'aosell', 'seller'],
  sellerType: ['all', 'shop', 'restaurant', 'individual'],
} as const;

const quickCities = ['Berlin', 'Hamburg', 'Munich'];

export default function SearchScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { searchListings, sellers } = useAosell();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<(typeof toggleOptions.type)[number]>('all');
  const [deliveryMode, setDeliveryMode] = useState<(typeof toggleOptions.deliveryMode)[number]>('all');
  const [sellerType, setSellerType] = useState<(typeof toggleOptions.sellerType)[number]>('all');
  const [countryCode, setCountryCode] = useState('DE');
  const [city, setCity] = useState('');

  const results = searchListings({ query, type, deliveryMode, sellerType, countryCode, city });

  return (
    <AppScreen>
      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <SectionTitle
          eyebrow={t('searchScreen.eyebrow')}
          title={t('searchScreen.title')}
          description={t('searchScreen.description')}
        />

        <View style={[styles.searchFrame, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <View style={styles.searchLead}>
            <SymbolView
              tintColor={theme.textSecondary}
              size={18}
              name={{ ios: 'magnifyingglass', android: 'search', web: 'magnifyingglass' }}
            />
            <View style={styles.searchInputWrap}>
              <AppInput
                label={t('searchScreen.question')}
                value={query}
                onChangeText={setQuery}
                placeholder={t('searchScreen.queryPlaceholder')}
              />
            </View>
          </View>
          <View style={styles.cityRow}>
            {quickCities.map((item) => {
              const active = city.toLowerCase() === item.toLowerCase();
              return (
                <Pressable
                  key={item}
                  onPress={() => setCity(active ? '' : item)}
                  style={[
                    styles.cityChip,
                    {
                      backgroundColor: active ? theme.earth : theme.backgroundElement,
                      borderColor: active ? theme.earth : theme.border,
                    },
                  ]}>
                  <ThemedText type="button" style={{ color: active ? theme.background : theme.text }}>
                    {item}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={[styles.filterPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.filterHeader}>
          <ThemedText type="headline">{t('searchScreen.refine')}</ThemedText>
          <StatusPill label={t('searchScreen.results', { count: results.length })} tone="brand" />
        </View>
        <View style={styles.inlineFields}>
          <View style={styles.field}>
            <AppInput label={t('common.country')} value={countryCode} onChangeText={setCountryCode} placeholder="DE" />
          </View>
          <View style={styles.field}>
            <AppInput label={t('common.city')} value={city} onChangeText={setCity} placeholder="Berlin" />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterRow kind="type" label={t('searchScreen.labels.type')} value={type} options={toggleOptions.type} onSelect={setType} />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterRow
            kind="deliveryMode"
            label={t('searchScreen.labels.delivery')}
            value={deliveryMode}
            options={toggleOptions.deliveryMode}
            onSelect={setDeliveryMode}
          />
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterRow
            kind="sellerType"
            label={t('searchScreen.labels.seller')}
            value={sellerType}
            options={toggleOptions.sellerType}
            onSelect={setSellerType}
          />
        </ScrollView>
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
        <EmptyState
          title={t('searchScreen.noResultsTitle')}
          description={t('searchScreen.noResultsDescription')}
        />
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
  kind: 'type' | 'deliveryMode' | 'sellerType';
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const theme = useTheme();
  const renderOptionLabel = (option: string) => {
    if (kind === 'type') {
      return getListingTypeLabel(option as 'all' | 'product' | 'meal' | 'service');
    }

    if (kind === 'deliveryMode') {
      return getDeliveryModeLabel(option as 'all' | 'aosell' | 'seller');
    }

    return getSellerTypeLabel(option as 'all' | 'shop' | 'restaurant' | 'individual');
  };

  return (
    <View style={styles.filterRow}>
      <ThemedText type="label" themeColor="textSecondary">
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
                styles.filterChip,
                {
                  backgroundColor: active ? theme.earth : theme.background,
                  borderColor: active ? theme.earth : theme.border,
                },
              ]}>
              <ThemedText type="button" style={{ color: active ? theme.background : theme.text }}>
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
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  searchFrame: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  searchLead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  searchInputWrap: {
    flex: 1,
  },
  cityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  cityChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  filterPanel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  field: {
    minWidth: 180,
    flexGrow: 1,
  },
  filterScroll: {
    gap: Spacing.md,
  },
  filterRow: {
    gap: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
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
