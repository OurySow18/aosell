import { StyleSheet, View } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export function StatCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, Shadows.card]}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="title">{value}</ThemedText>
      {helper ? (
        <ThemedText type="bodySmall" themeColor="textSecondary">
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 160,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
});
