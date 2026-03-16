import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="headline">{title}</ThemedText>
      <ThemedText type="body" themeColor="textSecondary">
        {description}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
});
