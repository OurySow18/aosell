import type { OrderStatus } from '../../../types';

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['pending_payment', 'canceled'],
  pending_payment: ['paid', 'canceled'],
  paid: ['confirmed', 'canceled', 'refunded'],
  confirmed: ['preparing', 'canceled'],
  preparing: ['out_for_delivery', 'canceled'],
  out_for_delivery: ['delivered', 'canceled'],
  delivered: ['delivered'],
  canceled: ['canceled'],
  refunded: ['refunded'],
};

export function getNextStatuses(status: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[status];
}
