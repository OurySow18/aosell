import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  type Locale,
  getI18nLocale,
  normalizeLocale,
  setI18nLocale,
  translate,
} from '@/lib/i18n';

const STORAGE_KEY = 'aosell.locale';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getI18nLocale());

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((storedLocale) => {
        if (!isMounted || !storedLocale) {
          return;
        }

        const nextLocale = normalizeLocale(storedLocale);
        setI18nLocale(nextLocale);
        setLocaleState(nextLocale);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      async setLocale(nextLocale) {
        setI18nLocale(nextLocale);
        setLocaleState(nextLocale);
        await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
      },
      t(key, vars) {
        return translate(key, vars, locale);
      },
    }),
    [locale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const context = useContext(LocaleContext);

  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }

  return context;
}

