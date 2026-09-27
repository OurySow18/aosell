import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function StatusPill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'success' | 'warning' | 'error' | 'brand';
}) {
  const theme = useAppTheme();
  const palette =
    tone === 'success'
      ? { background: theme.colors.successTint, text: theme.colors.success }
      : tone === 'warning'
        ? { background: theme.colors.warningTint, text: theme.colors.warning }
        : tone === 'error'
          ? { background: theme.colors.errorTint, text: theme.colors.error }
          : tone === 'brand'
            ? { background: theme.colors.accent, text: theme.colors.onAccent }
            : { background: theme.colors.surfaceMuted, text: theme.colors.text };

  return (
    <View style={[styles.pill, { backgroundColor: palette.background, borderRadius: theme.radii.pill }]}>
      <Text style={[styles.label, { color: palette.text, fontFamily: theme.typography.label.fontFamily }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6 },
  label: { fontSize: 12, lineHeight: 16 },
});
