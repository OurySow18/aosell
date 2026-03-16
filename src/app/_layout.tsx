import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AosellProvider } from '@/providers/aosell-provider';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AosellProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F5EFE6' } }}>
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
      </AosellProvider>
    </SafeAreaProvider>
  );
}
