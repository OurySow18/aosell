import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SellerProfile } from '@/types/domain';

import { useAppTheme } from '@/hooks/use-theme';
import { getDeliveryModeLabel, getSellerTypeLabel } from '@/lib/i18n';

export function SellerCard({
  seller,
  onPress,
}: {
  seller: SellerProfile;
  onPress: () => void;
}) {
  const theme = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl },
        theme.shadows.sm,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: theme.colors.accentTint }]}>
        {seller.coverImageUrl ? (
          <Image contentFit="cover" source={{ uri: seller.coverImageUrl }} style={StyleSheet.absoluteFillObject} transition={250} />
        ) : null}
        {seller.coverImageUrl ? <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.colors.overlay }]} /> : null}
        <View style={styles.coverTop}>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.94)' }]}>
            <Text style={[styles.typeBadgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
              {getSellerTypeLabel(seller.type)}
            </Text>
          </View>
          {seller.ratingAverage ? (
            <View style={[styles.ratingBadge, { backgroundColor: theme.colors.surface }]}>
              <SymbolView tintColor={theme.colors.accent} size={14} name={{ ios: 'star.fill', android: 'star', web: 'star' }} />
              <Text style={[styles.ratingText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {seller.ratingAverage.toFixed(1)}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
          <Text style={[styles.avatarText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {seller.brandName.slice(0, 2).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]} numberOfLines={1}>
            {seller.brandName}
          </Text>
          {seller.verificationStatus === 'verified' ? (
            <SymbolView tintColor={theme.colors.success} size={18} name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }} />
          ) : null}
        </View>
        <Text style={[styles.description, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]} numberOfLines={2}>
          {seller.description ?? `${getSellerTypeLabel(seller.type)} · ${seller.city}`}
        </Text>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textMuted, fontFamily: theme.typography.caption.fontFamily }]}>
            {seller.city}, {seller.countryCode}
          </Text>
          <Text
            style={[styles.footerLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}
            numberOfLines={1}>
            {seller.deliveryModes.map((mode) => getDeliveryModeLabel(mode)).join(' + ')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', borderWidth: 1 },
  cover: { minHeight: 180, padding: 12, justifyContent: 'space-between', gap: 12 },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  typeBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  typeBadgeText: { fontSize: 11, lineHeight: 14 },
  ratingBadge: {
    minHeight: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 5,
  },
  ratingText: { fontSize: 15, lineHeight: 20 },
  avatar: { width: 64, height: 64, justifyContent: 'center', alignItems: 'center', borderWidth: 2, alignSelf: 'flex-start' },
  avatarText: { fontSize: 17, lineHeight: 22 },
  content: { padding: 16, gap: 8 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 17, lineHeight: 22 },
  description: { fontSize: 15, lineHeight: 21 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  footerText: { fontSize: 13, lineHeight: 18 },
  footerLabel: { fontSize: 15, lineHeight: 20 },
  pressed: { opacity: 0.94, transform: [{ scale: 0.988 }] },
});
