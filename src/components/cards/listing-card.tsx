import { Pressable, StyleSheet, View } from 'react-native';

import type { Listing } from '../../../types';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';

export function ListingCard({
  listing,
  sellerName,
  onPress,
}: {
  listing: Listing;
  sellerName?: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
        },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.media, { backgroundColor: listing.type === 'meal' ? theme.burntOrange : theme.earth }]}>
        <ThemedText type="label" style={styles.mediaLabel}>
          {listing.type}
        </ThemedText>
        {listing.linkedVideoUrl ? <StatusPill label="Video available" tone="brand" /> : null}
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <ThemedText type="headline" numberOfLines={2}>
            {listing.title}
          </ThemedText>
          <ThemedText type="headline" style={{ color: theme.gold }}>
            {formatMoney(listing.price)}
          </ThemedText>
        </View>
        <ThemedText type="body" themeColor="textSecondary" numberOfLines={3}>
          {listing.description}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {sellerName ?? listing.city}
          </ThemedText>
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {listing.city}, {listing.countryCode}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  media: {
    minHeight: 168,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  mediaLabel: {
    color: '#F5EFE6',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.92,
  },
});
