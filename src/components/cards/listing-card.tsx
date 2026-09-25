import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Listing } from '@/types/domain';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
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
  const theme = useAppTheme();
  const { t } = useLocale();
  const primaryImage = getPrimaryListingImage(listing);
  const categoryAccent =
    listing.type === 'meal' ? theme.colors.secondary : listing.type === 'service' ? theme.colors.success : theme.colors.warning;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl },
        theme.shadows.sm,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.media, { backgroundColor: theme.colors.accentTint }]}>
        {primaryImage?.url ? (
          <Image contentFit="cover" source={{ uri: primaryImage.url }} style={StyleSheet.absoluteFillObject} transition={250} />
        ) : null}
        <View style={styles.mediaTop}>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.94)' }]}>
            <Text style={[styles.typeBadgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
              {getListingTypeLabel(listing.type)}
            </Text>
          </View>
          {listing.linkedVideoUrl ? (
            <View style={[styles.videoBadge, { backgroundColor: theme.colors.accentTint }]}>
              <Text style={[styles.typeBadgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
                {t('common.video')}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.priceBadge, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.priceText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {formatMoney(listing.price)}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sellerLine, { color: theme.colors.textMuted }]} numberOfLines={1}>
          {sellerName ?? t('listingDetail.sellerFallback')} · {listing.city}
        </Text>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={2}>
          {listing.title}
        </Text>
        <View style={styles.footer}>
          <View style={styles.metaItem}>
            <SymbolView tintColor={theme.colors.accent} size={15} name={{ ios: 'star.fill', android: 'star', web: 'star' }} />
            <Text style={[styles.metaText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
              {listing.averageRating ? listing.averageRating.toFixed(1) : t('common.new')}
            </Text>
          </View>
          <View style={[styles.metaDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.metaItem}>
            <SymbolView tintColor={theme.colors.textMuted} size={16} name={{ ios: 'shippingbox', android: 'local_shipping', web: 'local_shipping' }} />
            <Text style={[styles.metaTextMuted, { color: theme.colors.textMuted }]} numberOfLines={1}>
              {getDeliveryModeLabel(listing.deliveryMode)}
            </Text>
          </View>
        </View>
      </View>
      <View style={[styles.accentBar, { backgroundColor: categoryAccent }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: 1, position: 'relative' },
  media: { minHeight: 220, padding: 12, justifyContent: 'space-between' },
  mediaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  typeBadgeText: { fontSize: 11, lineHeight: 14 },
  videoBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  priceBadge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  priceText: { fontSize: 15, lineHeight: 20 },
  content: { padding: 16, gap: 7 },
  sellerLine: { fontSize: 13, lineHeight: 18 },
  title: { fontSize: 17, lineHeight: 24 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0 },
  metaText: { fontSize: 15, lineHeight: 20 },
  metaTextMuted: { fontSize: 13, lineHeight: 18 },
  metaDivider: { width: 1, height: 16 },
  accentBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 5 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.988 }] },
});
