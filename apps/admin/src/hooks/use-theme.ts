import { darkTheme, lightTheme } from '@aosell/core';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

// Same hydration-guard reasoning as apps/customer's useAppTheme: the web
// static export can't know the real color scheme on first render, so it
// defaults to light until an effect confirms it — admin has no manual
// light/dark override (not worth the UI for an internal tool), just system.
export function useAppTheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const scheme = useColorScheme();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const resolvedScheme = hasHydrated ? scheme : 'light';
  return resolvedScheme === 'dark' ? darkTheme : lightTheme;
}

// darkTheme's colors are typed as plain `string` (not literal hex unions
// like lightTheme's), so components type their theme prop from this instead
// of the `Theme` export — same pattern as apps/customer's own useAppTheme.
export type AppTheme = ReturnType<typeof useAppTheme>;
