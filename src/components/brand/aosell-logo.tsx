import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export function AosellLogo({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.wrapper, compact && styles.wrapperCompact]}>
      <View style={[styles.badge, { backgroundColor: theme.earth }]}>
        <ThemedText
          type={compact ? 'headline' : 'title'}
          style={[styles.badgeText, { color: theme.background }]}>
          AO
        </ThemedText>
      </View>
      <View style={styles.copy}>
        <ThemedText type={compact ? 'headline' : 'title'} style={styles.wordmark}>
          AoSell
        </ThemedText>
        {!compact ? (
          <ThemedText type="bodySmall" themeColor="textSecondary">
            Where people sell, cultures travel.
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  wrapperCompact: {
    gap: Spacing.sm,
  },
  badge: {
    width: 60,
    height: 60,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    letterSpacing: 1.5,
  },
  copy: {
    gap: 2,
  },
  wordmark: {
    letterSpacing: -0.6,
  },
});
