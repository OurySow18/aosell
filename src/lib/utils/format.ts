import type { Money, OrderStatus } from '@/types/domain';

import { getIntlLocale, translate } from '@/lib/i18n';

export function formatMoney(money: Money) {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: money.currency,
  }).format(money.amountCents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat(getIntlLocale(), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatStatus(status: OrderStatus) {
  return translate(`order.status.${status}.label`);
}
