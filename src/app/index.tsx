import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { LandingPage } from '@/components/landing/landing-page';
import { useAosell } from '@/providers/aosell-provider';

export default function IndexScreen() {
  const { currentUser } = useAosell();

  if (currentUser) {
    return <Redirect href="/home" />;
  }

  // The public marketing landing page only makes sense on the web — native
  // app installs go straight into the product (unchanged behavior).
  if (Platform.OS === 'web') {
    return <LandingPage />;
  }

  return <Redirect href="/welcome" />;
}
