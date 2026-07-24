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
      ? { background: theme.success, text: '#FFFFFF' }
      : tone === 'warning'
        ? { background: theme.warning, text: theme.earth }
        : tone === 'error'
          ? { background: theme.error, text: '#FFFFFF' }
          : tone === 'brand'
            ? { background: theme.accent, text: theme.earth }
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
});
