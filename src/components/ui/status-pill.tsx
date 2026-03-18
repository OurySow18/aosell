import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'brand';
}) {
  const theme = useTheme();
  const palette =
    tone === 'success'
      ? { background: theme.success, text: theme.background }
      : tone === 'warning'
        ? { background: theme.warning, text: theme.text }
        : tone === 'error'
          ? { background: theme.error, text: theme.background }
          : tone === 'brand'
            ? { background: theme.earth, text: theme.background }
            : { background: theme.backgroundSelected, text: theme.text };

  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <ThemedText type="label" style={{ color: palette.text }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
  },
});
