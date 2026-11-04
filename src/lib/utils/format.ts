import type { Money, OrderStatus } from '@/types/domain';

import { getIntlLocale, translate } from '@/lib/i18n';

export function formatMoney(money: Money) {
  return new Intl.NumberFormat(getIntlLocale(), {
    style: 'currency',
    currency: money.currency,
  }).format(money.amountCents / 100);
}

// Keeps stat counters (followers, likes…) to a fixed width as they grow —
// "1,2 k" instead of "1234" — matching how TikTok/Instagram display these.
export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(getIntlLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
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

export function formatRelativeTime(value: string, nowMs: number = Date.now()) {
  const elapsedMs = nowMs - new Date(value).getTime();
  const minutes = Math.floor(elapsedMs / 60000);

  if (minutes < 1) {
    return translate('common.relativeTime.justNow');
  }
  if (minutes < 60) {
    return translate('common.relativeTime.minutes', { count: minutes });
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return translate('common.relativeTime.hours', { count: hours });
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return translate('common.relativeTime.days', { count: days });
  }

  return formatDate(value);
}
