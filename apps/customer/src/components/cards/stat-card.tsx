import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function StatCard({ label, value, helper }: { label: string; value: string; helper?: string }) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
        theme.shadows.sm,
      ]}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <Text style={[styles.value, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>{value}</Text>
      {helper ? (
        <Text style={[styles.helper, { color: theme.colors.textMuted, fontFamily: theme.typography.caption.fontFamily }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 160, borderWidth: 1, padding: 16, gap: 6 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  value: { fontSize: 22, lineHeight: 28 },
  helper: { fontSize: 13, lineHeight: 18 },
});
