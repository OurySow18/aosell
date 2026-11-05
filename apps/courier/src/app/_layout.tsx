import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CourierAuthProvider } from '@/providers/courier-auth';
import { CourierOrdersProvider } from '@/providers/courier-orders';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CourierAuthProvider>
        <CourierOrdersProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="offer" />
            <Stack.Screen name="pickup" />
            <Stack.Screen name="delivery" />
            <Stack.Screen name="gains" />
          </Stack>
        </CourierOrdersProvider>
      </CourierAuthProvider>
    </SafeAreaProvider>
  );
}
