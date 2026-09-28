import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'aosell.themeMode';
const VALID_MODES: ThemeMode[] = ['system', 'light', 'dark'];

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined);

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!isMounted || !stored) {
          return;
        }
        if ((VALID_MODES as string[]).includes(stored)) {
          setThemeModeState(stored as ThemeMode);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      themeMode,
      async setThemeMode(nextMode) {
        setThemeModeState(nextMode);
        await AsyncStorage.setItem(STORAGE_KEY, nextMode);
      },
    }),
    [themeMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeModeContext() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error('useThemeModeContext must be used within ThemeModeProvider');
  }

  return context;
}
