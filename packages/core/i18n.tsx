import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type Locale = 'en' | 'fr' | 'de';

function detectDeviceLocale(): Locale {
  try {
    return normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'en';
  }
}

export function normalizeLocale(input?: string | null): Locale {
  const value = String(input ?? '').toLowerCase();
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('de')) return 'de';
  return 'en';
}

export function getIntlLocale(locale: Locale) {
  if (locale === 'fr') return 'fr-FR';
  if (locale === 'de') return 'de-DE';
  return 'en-GB';
}

function getValue(source: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((current, part) => {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    return (current as Record<string, unknown>)[part];
  }, source);
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, token: string) => String(vars[token] ?? ''));
}

// Builds a self-contained provider/hook pair bound to one app's own
// translation dictionary. apps/customer has its own hand-written version of
// this same engine (predates this package); admin and courier share this
// one instead of each reimplementing detection/storage/interpolation.
export function createI18n<T extends Record<string, unknown>>(translations: Record<Locale, T>, storageKey: string) {
  function translate(key: string, locale: Locale, vars?: Record<string, string | number>): string {
    const localized = getValue(translations[locale] as Record<string, unknown>, key);
    if (typeof localized === 'string') {
      return interpolate(localized, vars);
    }
    const fallback = getValue(translations.en as Record<string, unknown>, key);
    if (typeof fallback === 'string') {
      return interpolate(fallback, vars);
    }
    return key;
  }

  type LocaleContextValue = {
    locale: Locale;
    setLocale: (locale: Locale) => Promise<void>;
    t: (key: string, vars?: Record<string, string | number>) => string;
  };

  const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

  function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(detectDeviceLocale);

    useEffect(() => {
      let isMounted = true;
      AsyncStorage.getItem(storageKey)
        .then((stored) => {
          if (!isMounted || !stored) return;
          setLocaleState(normalizeLocale(stored));
        })
        .catch(() => undefined);
      return () => {
        isMounted = false;
      };
    }, []);

    const value = useMemo<LocaleContextValue>(
      () => ({
        locale,
        async setLocale(next) {
          setLocaleState(next);
          await AsyncStorage.setItem(storageKey, next);
        },
        t(key, vars) {
          return translate(key, locale, vars);
        },
      }),
      [locale]
    );

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
  }

  function useLocale() {
    const context = useContext(LocaleContext);
    if (!context) {
      throw new Error('useLocale must be used within its LocaleProvider');
    }
    return context;
  }

  return { LocaleProvider, useLocale, translate };
}
