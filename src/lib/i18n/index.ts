import type { DeliveryMode, ListingStatus, SellerType } from '@/types/domain';

import { translations } from '@/lib/i18n/translations';

export type Locale = 'en' | 'fr' | 'de';

let currentLocale: Locale = detectDeviceLocale();

type TranslationDictionary = (typeof translations)[Locale];

function detectDeviceLocale(): Locale {
  try {
    return normalizeLocale(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {
    return 'en';
  }
}

function getDictionary(locale: Locale): TranslationDictionary {
  return translations[locale];
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

export function normalizeLocale(input?: string | null): Locale {
  const value = String(input ?? '').toLowerCase();

  if (value.startsWith('fr')) {
    return 'fr';
  }

  if (value.startsWith('de')) {
    return 'de';
  }

  return 'en';
}

export function setI18nLocale(locale: Locale) {
  currentLocale = locale;
}

export function getI18nLocale() {
  return currentLocale;
}

export function getIntlLocale(locale: Locale = currentLocale) {
  if (locale === 'fr') {
    return 'fr-FR';
  }

  if (locale === 'de') {
    return 'de-DE';
  }

  return 'en-GB';
}

export function translate(
  key: string,
  vars?: Record<string, string | number>,
  locale: Locale = currentLocale
) {
  const localized = getValue(getDictionary(locale) as unknown as Record<string, unknown>, key);

  if (typeof localized === 'string') {
    return interpolate(localized, vars);
  }

  const fallback = getValue(getDictionary('en') as unknown as Record<string, unknown>, key);

  if (typeof fallback === 'string') {
    return interpolate(fallback, vars);
  }

  return key;
}

export function getListingTypeLabel(value: 'all' | 'product' | 'meal' | 'service') {
  return value === 'all' ? translate('common.all') : translate(`domain.listingType.${value}`);
}

export function getSellerTypeLabel(value: 'all' | SellerType) {
  return value === 'all' ? translate('common.all') : translate(`domain.sellerType.${value}`);
}

export function getDeliveryModeLabel(value: 'all' | DeliveryMode) {
  return value === 'all' ? translate('common.all') : translate(`domain.deliveryMode.${value}`);
}

export function getListingStatusLabel(value: ListingStatus) {
  return translate(`domain.listingStatus.${value}`);
}

export function getVerificationStatusLabel(value: 'pending' | 'verified' | 'rejected') {
  return translate(`domain.verificationStatus.${value}`);
}

