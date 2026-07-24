import { ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppScreenProps = {
  children: ReactNode;
  padded?: boolean;
};

export function AppScreen({ children, padded = true }: AppScreenProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const horizontalInset = padded ? Spacing.lg * 2 : 0;
  const innerWidth = Math.min(Math.max(width - horizontalInset, 0), MaxContentWidth);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, padded && styles.padded]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { width: innerWidth }]}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
  },
  padded: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl + 92,
  },
  inner: {
    minWidth: 0,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.xxl,
  },
});
