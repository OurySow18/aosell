import { Pressable, StyleSheet, View } from 'react-native';

import type { SellerProfile } from '../../../types';

import { Radius, Shadows, Spacing } from '@/constants/theme';
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.card,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.earth }]}>
        <ThemedText type="headline" style={{ color: theme.background }}>
          {seller.brandName.slice(0, 2).toUpperCase()}
        </ThemedText>
      </View>
      <View style={styles.content}>
        <ThemedText type="headline">{seller.brandName}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary" numberOfLines={2}>
          {seller.description ?? `Local ${seller.type} serving ${seller.city}.`}
        </ThemedText>
        <View style={styles.footer}>
          <StatusPill label={seller.type} tone="brand" />
          <StatusPill label={seller.verificationStatus} tone="neutral" />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.large,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    gap: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
});
