import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { darkTheme, lightTheme } from '@/constants/theme';
import { useThemeModeContext } from '@/providers/theme-mode-provider';

export { type ThemeMode } from '@/providers/theme-mode-provider';

export function useThemeMode() {
  return useThemeModeContext();
}

/**
 * Dark-mode-aware access to the "Mangue" design system. `useColorScheme()`
 * returns null on the first web render before hydration, so we default to
 * light until the effect confirms the real scheme (avoids a light/dark
 * mismatch flash on static web export). A manual choice from `ThemeModeProvider`
 * (Profil) overrides the system scheme when set to 'light' or 'dark'.
 */
export function useAppTheme() {
  const [hasHydrated, setHasHydrated] = useState(false);
  const scheme = useColorScheme();
  const { themeMode } = useThemeModeContext();

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const resolvedScheme = themeMode === 'system' ? (hasHydrated ? scheme : 'light') : themeMode;
  return resolvedScheme === 'dark' ? darkTheme : lightTheme;
}
