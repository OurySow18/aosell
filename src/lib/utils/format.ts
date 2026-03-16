import type { Money, OrderStatus } from '../../../types';

export function formatMoney(money: Money) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: money.currency,
  }).format(money.amountCents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatStatus(status: OrderStatus) {
  return status.replaceAll('_', ' ');
}
