import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Listing } from '@/types/domain';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel, getListingTypeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
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
  const { t } = useLocale();
  const primaryImage = getPrimaryListingImage(listing);
  const fallbackColor =
    listing.type === 'meal'
      ? theme.gold
      : listing.type === 'service'
        ? theme.forestGreen
        : theme.earth;

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
      <View style={[styles.media, { backgroundColor: fallbackColor }]}>
        {primaryImage?.url ? (
          <Image
            contentFit="cover"
            source={{ uri: primaryImage.url }}
            style={StyleSheet.absoluteFillObject}
            transition={250}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: primaryImage?.url ? theme.overlay : fallbackColor },
          ]}
        />
        <View style={styles.mediaTop}>
          <StatusPill label={getListingTypeLabel(listing.type)} tone="brand" />
          <View style={styles.mediaFlags}>
            {listing.averageRating ? (
              <View style={[styles.ratingBadge, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="button">{listing.averageRating.toFixed(1)}</ThemedText>
              </View>
            ) : null}
            {listing.linkedVideoUrl ? <StatusPill label={t('common.video')} tone="warning" /> : null}
          </View>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="headline" numberOfLines={2} style={styles.title}>
            {listing.title}
          </ThemedText>
        </View>
        <ThemedText type="bodySmall" themeColor="textSecondary" numberOfLines={1}>
          {sellerName ?? t('listingDetail.sellerFallback')} · {listing.city}, {listing.countryCode}
        </ThemedText>
        <View style={styles.metaLine}>
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {listing.inventory.isUnlimited
              ? t('listingDetail.availableOnDemand')
              : t('listingDetail.leftCount', { count: listing.inventory.quantity ?? 0 })}
          </ThemedText>
          <View style={styles.dot} />
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {getDeliveryModeLabel(listing.deliveryMode)}
          </ThemedText>
        </View>
        <View style={styles.priceRow}>
          <ThemedText type="title" style={{ color: theme.text }}>
            {formatMoney(listing.price)}
          </ThemedText>
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {listing.categories[0] ?? t('listingDetail.general')}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    overflow: 'hidden',
    borderWidth: 1,
  },
  media: {
    minHeight: 208,
    padding: Spacing.md,
    justifyContent: 'flex-start',
  },
  mediaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  mediaFlags: {
    gap: Spacing.sm,
    alignItems: 'flex-end',
  },
  ratingBadge: {
    minWidth: 42,
    minHeight: 32,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  titleRow: {
    gap: Spacing.xs,
  },
  title: {
    lineHeight: 28,
  },
  metaLine: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: Radius.pill,
    backgroundColor: '#BDBDBD',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'baseline',
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
});
