import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/hooks/use-theme';

type Tone = 'success' | 'warning' | 'error' | 'neutral';

export function StatusPill({ label, tone, theme }: { label: string; tone: Tone; theme: AppTheme }) {
  const toneColors: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: theme.colors.successTint, fg: theme.colors.success },
    warning: { bg: theme.colors.warningTint, fg: theme.colors.warning },
    error: { bg: theme.colors.errorTint, fg: theme.colors.error },
    neutral: { bg: theme.colors.surfaceMuted, fg: theme.colors.textMuted },
  };
  const colors = toneColors[tone];

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderRadius: theme.radii.pill }]}>
      <Text style={[styles.label, { color: colors.fg, fontFamily: theme.typography.fontFamily.bodySemi }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  label: { fontSize: 12, lineHeight: 16 },
});
