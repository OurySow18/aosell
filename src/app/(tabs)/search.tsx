import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ListingCard } from '@/components/cards/listing-card';
import { AppInput } from '@/components/ui/app-input';
import { AppScreen } from '@/components/ui/app-screen';
import { SectionTitle } from '@/components/ui/section-title';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

const toggleOptions = {
  type: ['all', 'product', 'meal', 'service'],
  deliveryMode: ['all', 'aosell', 'seller'],
  sellerType: ['all', 'shop', 'restaurant', 'individual'],
} as const;

export default function SearchScreen() {
  const theme = useTheme();
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
      <SectionTitle
        eyebrow="Search"
        title="Discover what matters quickly"
        description="V1 search is Firestore-oriented: keyword matching plus focused filters for listing type, seller type, delivery, and place."
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <AppInput label="Search query" value={query} onChangeText={setQuery} placeholder="e.g. jollof, decor, repair" />
        <View style={styles.row}>
          <AppInput label="Country" value={countryCode} onChangeText={setCountryCode} placeholder="DE" />
          <AppInput label="City" value={city} onChangeText={setCity} placeholder="Berlin" />
        </View>

        <FilterRow label="Listing type" value={type} options={toggleOptions.type} onSelect={setType} />
        <FilterRow
          label="Delivery mode"
          value={deliveryMode}
          options={toggleOptions.deliveryMode}
          onSelect={setDeliveryMode}
        />
        <FilterRow
          label="Seller type"
          value={sellerType}
          options={toggleOptions.sellerType}
          onSelect={setSellerType}
        />
      </View>

      <View style={styles.resultsHeader}>
        <ThemedText type="headline">{results.length} results</ThemedText>
        <ThemedText type="bodySmall" themeColor="textSecondary">
          Search tokens can later be generated with Cloud Functions for stronger relevancy.
        </ThemedText>
      </View>

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
    </AppScreen>
  );
}

function FilterRow({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onSelect: (value: any) => void;
}) {
  const theme = useTheme();

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
                {option}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    flexWrap: 'wrap',
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
  resultsHeader: {
    gap: Spacing.xs,
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
