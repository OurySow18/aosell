import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSegments } from 'expo-router';

import { AppHeader } from '@/components/ui/app-header';
import { MaxContentWidth } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-theme';

type AppScreenProps = {
  children: ReactNode;
  padded?: boolean;
};

export function AppScreen({ children, padded = true }: AppScreenProps) {
  const theme = useAppTheme();
  const segments = useSegments();
  const isSearchScreen = segments[segments.length - 1] === 'search';

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, padded && { paddingHorizontal: 20, paddingTop: 12, paddingBottom: theme.spacing[8] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.inner, { gap: theme.spacing[6] }]}>
          {padded && !isSearchScreen ? <AppHeader /> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center' },
  inner: { width: '100%', minWidth: 0, maxWidth: MaxContentWidth, alignSelf: 'center' },
});
