import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { AosellProvider } from '@/providers/aosell-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { useAosell } from '@/providers/aosell-provider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function SessionBootScreen() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <SafeAreaView
      edges={['top', 'right', 'bottom', 'left']}
      style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={[styles.bootPanel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.bootAccent, { backgroundColor: theme.clay }]} />
        <AosellLogo />
        <View style={styles.copy}>
          <ThemedText type="headline">{t('boot.title')}</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {t('boot.description')}
          </ThemedText>
        </View>
        <View style={[styles.bootTrack, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.bootProgress, { backgroundColor: theme.accent }]} />
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
        <Stack.Screen name="post/[postId]" />
        <Stack.Screen name="post/create" />
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
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
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
    alignItems: 'center',
  },
  bootPanel: {
    borderWidth: 1.5,
    borderRadius: Radius.xlarge,
    padding: Spacing.xl,
    gap: Spacing.xl,
    alignSelf: 'stretch',
    maxWidth: 520,
    overflow: 'hidden',
  },
  copy: {
    gap: Spacing.sm,
  },
  bootAccent: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: -40,
    top: -55,
    opacity: 0.12,
  },
  bootTrack: {
    height: 8,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  bootProgress: {
    width: '58%',
    height: '100%',
    borderRadius: Radius.pill,
  },
});
