import type { OrderStatus } from '@/types/domain';
import { translate } from '@/lib/i18n';

export const ORDER_PROGRESS_FLOW: OrderStatus[] = [
  'created',
  'pending_payment',
  'paid',
  'confirmed',
  'preparing',
  'out_for_delivery',
  'delivered',
];

export type OrderProgressStep = {
  description: string;
  label: string;
  state: 'complete' | 'current' | 'upcoming';
  status: OrderStatus;
};

export function getOrderStatusLabel(status: OrderStatus) {
  return translate(`order.status.${status}.label`);
}

export function getOrderStatusDescription(status: OrderStatus) {
  return translate(`order.status.${status}.description`);
}

export function getOrderStatusTone(status: OrderStatus) {
  if (status === 'delivered' || status === 'paid') {
    return 'success' as const;
  }

  if (status === 'pending_payment' || status === 'refunded') {
    return 'warning' as const;
  }

  if (status === 'canceled') {
    return 'error' as const;
  }

  return 'brand' as const;
}

export function isTerminalOrderStatus(status: OrderStatus) {
  return status === 'canceled' || status === 'refunded';
}

export function getOrderProgressSteps(
  status: OrderStatus,
  timelineStatuses: OrderStatus[] = []
): OrderProgressStep[] {
  const timelineIndexes = timelineStatuses
    .map((item) => ORDER_PROGRESS_FLOW.indexOf(item))
    .filter((item) => item >= 0);
  const furthestSeenIndex = timelineIndexes.length ? Math.max(...timelineIndexes) : 0;
  const currentIndex = ORDER_PROGRESS_FLOW.indexOf(status);
  const lastCompletedIndex =
    currentIndex >= 0 ? currentIndex : furthestSeenIndex >= 0 ? furthestSeenIndex : 0;
  const terminal = isTerminalOrderStatus(status);

  return ORDER_PROGRESS_FLOW.map((stepStatus, index) => ({
    status: stepStatus,
    label: getOrderStatusLabel(stepStatus),
    description: getOrderStatusDescription(stepStatus),
    state:
      terminal || currentIndex < 0
        ? index <= lastCompletedIndex
          ? 'complete'
          : 'upcoming'
        : index < currentIndex
          ? 'complete'
          : index === currentIndex
            ? 'current'
            : 'upcoming',
  }));
}
