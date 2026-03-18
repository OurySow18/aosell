import { Redirect } from 'expo-router';

import { useAosell } from '@/providers/aosell-provider';

export default function IndexScreen() {
  const { currentUser } = useAosell();

  if (currentUser) {
    return <Redirect href="/home" />;
  }

  return <Redirect href={{ pathname: '/auth', params: { mode: 'signup', role: 'buyer' } }} />;
}
