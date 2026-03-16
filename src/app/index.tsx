import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function EntryScreen() {
  const theme = useTheme();

  return (
    <AppScreen>
      <View style={[styles.hero, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.crest, { backgroundColor: theme.gold }]}>
          <AosellLogo />
        </View>
        <View style={styles.copy}>
          <ThemedText type="display">Premium discovery for products, meals, and services.</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            AoSell starts with Europe and puts culture-rich storefronts, curated discovery, and dependable checkout in one calm marketplace.
          </ThemedText>
        </View>
        <View style={styles.actions}>
          <AppButton fullWidth label="Explore" onPress={() => router.replace('/home')} />
          <AppButton
            fullWidth
            label="Create account"
            onPress={() => router.push('/auth')}
            variant="secondary"
          />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: '100%',
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.xxxl,
    justifyContent: 'space-between',
    gap: Spacing.xxl,
  },
  crest: {
    alignSelf: 'flex-start',
    padding: Spacing.lg,
    borderRadius: Radius.large,
  },
  copy: {
    gap: Spacing.lg,
    maxWidth: 680,
  },
  actions: {
    gap: Spacing.md,
    maxWidth: 320,
  },
});
