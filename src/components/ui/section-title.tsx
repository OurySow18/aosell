import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <ThemedText type="label" themeColor="burntOrange">
          {eyebrow}
        </ThemedText>
      ) : null}
      <ThemedText type="title">{title}</ThemedText>
      {description ? (
        <ThemedText type="body" themeColor="textSecondary">
          {description}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
});
