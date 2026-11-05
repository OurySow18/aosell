import type { Order } from '@/types/domain';

export type DailyOrderStats = {
  count: number;
  revenueCents: number;
  avgBasketCents: number;
  previousWeekCount: number;
  deltaPct: number | null;
};

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function computeDailyOrderStats(orders: Order[], now: Date = new Date()): DailyOrderStats {
  const lastWeek = new Date(now);
  lastWeek.setDate(now.getDate() - 7);

  const todayOrders = orders.filter((order) => isSameCalendarDay(new Date(order.createdAt), now));
  const lastWeekOrders = orders.filter((order) => isSameCalendarDay(new Date(order.createdAt), lastWeek));

  const revenueCents = todayOrders.reduce((total, order) => total + order.total.amountCents, 0);
  const avgBasketCents = todayOrders.length ? Math.round(revenueCents / todayOrders.length) : 0;
  const deltaPct = lastWeekOrders.length
    ? Math.round(((todayOrders.length - lastWeekOrders.length) / lastWeekOrders.length) * 100)
    : null;

  return {
    count: todayOrders.length,
    revenueCents,
    avgBasketCents,
    previousWeekCount: lastWeekOrders.length,
    deltaPct,
  };
}
