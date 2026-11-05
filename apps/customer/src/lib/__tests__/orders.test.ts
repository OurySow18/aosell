import type { Order } from '@/types/domain';
import { computeDailyOrderStats } from '@/lib/orders';

const NOW = new Date('2026-09-25T18:00:00.000Z');

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    buyerUserId: 'buyer-1',
    sellerId: 'seller-1',
    status: 'paid',
    items: [],
    subtotal: { amountCents: 1000, currency: 'EUR' },
    deliveryFee: { amountCents: 450, currency: 'EUR' },
    total: { amountCents: 1450, currency: 'EUR' },
    currency: 'EUR',
    deliveryMode: 'aosell',
    deliveryAddress: {
      id: 'address-1',
      fullName: 'Test',
      phoneNumber: '123',
      line1: 'Street 1',
      postalCode: '00000',
      city: 'Bremen',
      countryCode: 'DE',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    },
    timeline: [],
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

describe('computeDailyOrderStats', () => {
  it('counts and sums only orders created today', () => {
    const orders = [
      makeOrder({ id: 'a', total: { amountCents: 1000, currency: 'EUR' }, createdAt: NOW.toISOString() }),
      makeOrder({ id: 'b', total: { amountCents: 2000, currency: 'EUR' }, createdAt: NOW.toISOString() }),
      makeOrder({ id: 'c', total: { amountCents: 5000, currency: 'EUR' }, createdAt: '2026-09-20T10:00:00.000Z' }),
    ];

    const stats = computeDailyOrderStats(orders, NOW);

    expect(stats.count).toBe(2);
    expect(stats.revenueCents).toBe(3000);
    expect(stats.avgBasketCents).toBe(1500);
  });

  it('returns zeroed stats with no delta when there are no orders today or last week', () => {
    const stats = computeDailyOrderStats([], NOW);

    expect(stats.count).toBe(0);
    expect(stats.revenueCents).toBe(0);
    expect(stats.avgBasketCents).toBe(0);
    expect(stats.deltaPct).toBeNull();
  });

  it('computes a positive delta against the same weekday last week', () => {
    const lastWeek = new Date(NOW);
    lastWeek.setDate(NOW.getDate() - 7);

    const orders = [
      makeOrder({ id: 'today-1', createdAt: NOW.toISOString() }),
      makeOrder({ id: 'today-2', createdAt: NOW.toISOString() }),
      makeOrder({ id: 'last-week-1', createdAt: lastWeek.toISOString() }),
    ];

    const stats = computeDailyOrderStats(orders, NOW);

    expect(stats.count).toBe(2);
    expect(stats.previousWeekCount).toBe(1);
    expect(stats.deltaPct).toBe(100);
  });

  it('computes a negative delta when today has fewer orders than last week', () => {
    const lastWeek = new Date(NOW);
    lastWeek.setDate(NOW.getDate() - 7);

    const orders = [
      makeOrder({ id: 'today-1', createdAt: NOW.toISOString() }),
      makeOrder({ id: 'last-week-1', createdAt: lastWeek.toISOString() }),
      makeOrder({ id: 'last-week-2', createdAt: lastWeek.toISOString() }),
    ];

    const stats = computeDailyOrderStats(orders, NOW);

    expect(stats.deltaPct).toBe(-50);
  });
});
