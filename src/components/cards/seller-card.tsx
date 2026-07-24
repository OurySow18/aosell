import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SellerProfile } from '@/types/domain';

import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getDeliveryModeLabel, getSellerTypeLabel } from '@/lib/i18n';

export function SellerCard({
  seller,
  onPress,
}: {
  seller: SellerProfile;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: theme.backgroundSelected }]}>
        {seller.coverImageUrl ? (
          <Image
            contentFit="cover"
            source={{ uri: seller.coverImageUrl }}
            style={StyleSheet.absoluteFillObject}
            transition={250}
          />
        ) : null}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: seller.coverImageUrl
                ? 'rgba(53, 21, 12, 0.2)'
                : theme.backgroundSelected,
            },
          ]}
        />
        <View style={styles.coverTop}>
          <StatusPill label={getSellerTypeLabel(seller.type)} tone="brand" />
          {seller.ratingAverage ? (
            <View style={[styles.ratingBadge, { backgroundColor: theme.backgroundElement }]}>
              <SymbolView
                tintColor={theme.text}
                size={14}
                name={{ ios: 'star.fill', android: 'star', web: 'star' }}
              />
              <ThemedText type="button">{seller.ratingAverage.toFixed(1)}</ThemedText>
            </View>
          ) : null}
        </View>
        <View
          style={[
            styles.avatar,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="headline" style={{ color: theme.earth }}>
            {seller.brandName.slice(0, 2).toUpperCase()}
          </ThemedText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <ThemedText type="headline" style={styles.name}>
            {seller.brandName}
          </ThemedText>
          {seller.verificationStatus === 'verified' ? (
            <SymbolView
              tintColor={theme.forestGreen}
              size={18}
              name={{ ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' }}
            />
          ) : null}
        </View>
        <ThemedText type="body" themeColor="textSecondary" numberOfLines={2}>
          {seller.description ?? `${getSellerTypeLabel(seller.type)} · ${seller.city}`}
        </ThemedText>
        <View style={styles.footer}>
          <ThemedText type="bodySmall" themeColor="textSecondary">
            {seller.city}, {seller.countryCode}
          </ThemedText>
          <ThemedText type="button" numberOfLines={1}>
            {seller.deliveryModes.map((mode) => getDeliveryModeLabel(mode)).join(' + ')}
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
  cover: {
    minHeight: 180,
    padding: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  coverTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  ratingBadge: {
    minHeight: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 5,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  name: {
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
});
