import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { AosellProvider } from '@/providers/aosell-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { useAosell } from '@/providers/aosell-provider';

function SessionBootScreen() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.bootPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <AosellLogo />
        <View style={styles.copy}>
          <ThemedText type="headline">{t('boot.title')}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {t('boot.description')}
          </ThemedText>
        </View>
      </View>
    </SafeAreaView>
  );
}

function RootNavigator() {
  const theme = useTheme();
  const { authReady } = useAosell();

  if (!authReady) {
    return <SessionBootScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.background } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="cart" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="checkout/success" />
        <Stack.Screen name="listing/[listingId]" />
        <Stack.Screen name="listing/edit/[listingId]" />
        <Stack.Screen name="orders/[orderId]" />
        <Stack.Screen name="seller/[sellerId]" />
        <Stack.Screen name="seller-onboarding" />
        <Stack.Screen name="seller-center" />
        <Stack.Screen name="notifications" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LocaleProvider>
        <AosellProvider>
          <RootNavigator />
        </AosellProvider>
      </LocaleProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  bootPanel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xxxl,
    gap: Spacing.xl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 520,
  },
  copy: {
    gap: Spacing.sm,
  },
});
