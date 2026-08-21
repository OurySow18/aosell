import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Listing } from '@/types/domain';

import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { getDeliveryModeLabel, getListingTypeLabel } from '@/lib/i18n';
import { formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';

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
  const categoryAccent =
    listing.type === 'meal' ? theme.coral : listing.type === 'service' ? theme.forestGreen : theme.clay;
  const categorySurface =
    listing.type === 'meal'
      ? '#FBE5DC'
      : listing.type === 'service'
        ? '#E3F0E7'
        : '#FFF1D2';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.media, { backgroundColor: categorySurface }]}>
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
            {
              backgroundColor: primaryImage?.url
                ? 'rgba(53, 21, 12, 0.12)'
                : categorySurface,
            },
          ]}
        />
        <View style={styles.mediaTop}>
          <View style={[styles.typeBadge, { backgroundColor: categorySurface }]}>
            <ThemedText type="label" style={{ color: theme.earth }}>
              {getListingTypeLabel(listing.type)}
            </ThemedText>
          </View>
          {listing.linkedVideoUrl ? <StatusPill label={t('common.video')} tone="warning" /> : null}
        </View>
        <View style={[styles.priceBadge, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="headline">{formatMoney(listing.price)}</ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText type="bodySmall" themeColor="textSecondary" numberOfLines={1}>
          {sellerName ?? t('listingDetail.sellerFallback')} · {listing.city}
        </ThemedText>
        <ThemedText type="headline" numberOfLines={2} style={styles.title}>
          {listing.title}
        </ThemedText>
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <SymbolView
              tintColor={theme.gold}
              size={15}
              name={{ ios: 'star.fill', android: 'star', web: 'star' }}
            />
            <ThemedText type="button">
              {listing.averageRating ? listing.averageRating.toFixed(1) : t('common.new')}
            </ThemedText>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: theme.border }]} />
          <View style={styles.metaItem}>
            <SymbolView
              tintColor={theme.textSecondary}
              size={16}
              name={{ ios: 'shippingbox', android: 'local_shipping', web: 'local_shipping' }}
            />
            <ThemedText type="bodySmall" themeColor="textSecondary" numberOfLines={1}>
              {getDeliveryModeLabel(listing.deliveryMode)}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={[styles.accentBar, { backgroundColor: categoryAccent }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
  },
  media: {
    minHeight: 220,
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  mediaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  typeBadge: {
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  content: {
    padding: Spacing.lg,
    gap: 7,
  },
  title: {
    lineHeight: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  metaDivider: {
    width: 1,
    height: 16,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
});
