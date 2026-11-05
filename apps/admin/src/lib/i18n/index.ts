import { createI18n } from '@aosell/core';

import { translations } from './translations';

export const { LocaleProvider, useLocale } = createI18n(translations, 'aosell-admin.locale');
export type { Locale } from '@aosell/core';
