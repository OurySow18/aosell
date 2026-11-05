import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function EmptyState({ title, description }: { title: string; description: string }) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg }]}>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, padding: 20, gap: 8 },
  title: { fontSize: 17, lineHeight: 22 },
  description: { fontSize: 15, lineHeight: 21 },
});
