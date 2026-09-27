import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from '@/constants/theme';

/**
 * Dark-mode-aware access to the "Mangue" design system. `useColorScheme()`
 * returns null on the first web render before hydration, so we default to
 * light until the effect confirms the real scheme (avoids a light/dark
 * mismatch flash on static web export).
 */
export function useAppTheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const resolvedScheme = hasHydrated ? scheme : 'light';
  return resolvedScheme === 'dark' ? darkTheme : lightTheme;
}
