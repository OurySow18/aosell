import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import {
  BottomTabBarGap,
  BottomTabBarHeight,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type AppScreenProps = {
  children: ReactNode;
  padded?: boolean;
};

export function AppScreen({ children, padded = true }: AppScreenProps) {
  const theme = useTheme();
  const segments = useSegments();
  const hasBottomTabs = segments[0] === '(tabs)';
  const isSearchScreen = segments[segments.length - 1] === 'search';

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          padded && styles.padded,
          padded && hasBottomTabs && styles.bottomTabClearance,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.inner}>
          {padded && !isSearchScreen ? <AppHeader /> : null}
          {children}
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  bottomTabClearance: {
    paddingBottom: Spacing.xxxl + BottomTabBarHeight + BottomTabBarGap,
  },
  inner: {
    width: '100%',
    minWidth: 0,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.xl,
  },
});
