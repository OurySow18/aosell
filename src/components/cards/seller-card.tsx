import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SellerProfile } from '@/types/domain';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import {
  getDeliveryModeLabel,
  getSellerTypeLabel,
  getVerificationStatusLabel,
} from '@/lib/i18n';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';
import { StatusPill } from '@/components/ui/status-pill';

export function SellerCard({
  seller,
  onPress,
}: {
  seller: SellerProfile;
  onPress: () => void;
}) {
  const theme = useTheme();
  const verificationTone =
    seller.verificationStatus === 'verified'
      ? 'success'
      : seller.verificationStatus === 'rejected'
        ? 'error'
        : 'warning';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.cover, { backgroundColor: theme.earth }]}>
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
            { backgroundColor: seller.coverImageUrl ? theme.overlay : theme.earth },
          ]}
        />
        <View style={styles.coverTop}>
          <StatusPill label={getSellerTypeLabel(seller.type)} tone="brand" />
          {seller.ratingAverage ? (
            <View style={[styles.ratingBadge, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="button">{seller.ratingAverage.toFixed(1)}</ThemedText>
            </View>
          ) : null}
        </View>
        <View style={[styles.avatar, { backgroundColor: theme.background }]}>
          <ThemedText type="headline" style={{ color: theme.earth }}>
            {seller.brandName.slice(0, 2).toUpperCase()}
          </ThemedText>
        </View>
      </View>
      <View style={styles.content}>
        <ThemedText type="headline">{seller.brandName}</ThemedText>
        <ThemedText type="bodySmall" themeColor="textSecondary">
          {seller.city}, {seller.countryCode}
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary" numberOfLines={2}>
          {seller.description ?? `${getSellerTypeLabel(seller.type)} · ${seller.city}`}
        </ThemedText>
        <View style={styles.footer}>
          <StatusPill label={getVerificationStatusLabel(seller.verificationStatus)} tone={verificationTone} />
          <StatusPill label={seller.deliveryModes.map((mode) => getDeliveryModeLabel(mode)).join(' + ')} tone="neutral" />
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
    minWidth: 42,
    minHeight: 32,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.sm,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.992 }],
  },
});
