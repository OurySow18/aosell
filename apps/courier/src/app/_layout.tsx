import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CourierAuthProvider } from '@/providers/courier-auth';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <CourierAuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="history" />
        </Stack>
      </CourierAuthProvider>
    </SafeAreaProvider>
  );
}
