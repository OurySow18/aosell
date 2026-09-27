import { StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.container}>
      {eyebrow ? (
        <View style={styles.eyebrowRow}>
          <View style={[styles.eyebrowLine, { backgroundColor: theme.colors.accent }]} />
          <Text style={[styles.eyebrow, { color: theme.colors.accent, fontFamily: theme.typography.micro.fontFamily }]}>{eyebrow}</Text>
        </View>
      ) : null}
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrowLine: { width: 24, height: 4, borderRadius: 2 },
  eyebrow: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  title: { fontSize: 22, lineHeight: 28 },
  description: { fontSize: 15, lineHeight: 22 },
});
