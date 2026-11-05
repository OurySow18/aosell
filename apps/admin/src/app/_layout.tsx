import { Stack } from 'expo-router';

import { AdminAuthProvider } from '@/providers/admin-auth';

export default function RootLayout() {
  return (
    <AdminAuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="sellers" />
        <Stack.Screen name="couriers" />
        <Stack.Screen name="orders" />
      </Stack>
    </AdminAuthProvider>
  );
}
