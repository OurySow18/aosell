import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { useLocale } from '@/hooks/use-locale';
import { useAppTheme } from '@/hooks/use-theme';
import { AosellProvider } from '@/providers/aosell-provider';
import { LocaleProvider } from '@/providers/locale-provider';
import { useAosell } from '@/providers/aosell-provider';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function SessionBootScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();

  return (
    <SafeAreaView edges={['top', 'right', 'bottom', 'left']} style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View
        style={[
          styles.bootPanel,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.sheet },
        ]}>
        <View style={[styles.bootAccent, { backgroundColor: theme.colors.accent }]} />
        <AosellLogo />
        <View style={styles.copy}>
          <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('boot.title')}
          </Text>
          <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
            {t('boot.description')}
          </Text>
        </View>
        <View style={[styles.bootTrack, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill }]}>
          <View style={[styles.bootProgress, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.pill }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function RootNavigator() {
  const theme = useAppTheme();
  const { authReady } = useAosell();

  if (!authReady) {
    return <SessionBootScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.background } }}>
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
  safeArea: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' },
  bootPanel: { borderWidth: 1.5, padding: 24, gap: 24, alignSelf: 'stretch', maxWidth: 520, overflow: 'hidden' },
  copy: { gap: 8 },
  bootAccent: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: -40, top: -55, opacity: 0.12 },
  bootTrack: { height: 8, overflow: 'hidden' },
  bootProgress: { width: '58%', height: '100%' },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
});
