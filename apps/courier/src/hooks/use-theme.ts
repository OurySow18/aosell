import { darkTheme, lightTheme } from '@aosell/core';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

export function useAppTheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const resolvedScheme = hasHydrated ? scheme : 'light';
  return resolvedScheme === 'dark' ? darkTheme : lightTheme;
}

export type AppTheme = ReturnType<typeof useAppTheme>;
