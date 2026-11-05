import { OrderRepository } from '@aosell/core';
import type { Order } from '@aosell/core';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useCourierAuth } from '@/providers/courier-auth';

type CourierOrdersValue = {
  orders: Order[];
  offeredOrder: Order | null;
  activeOrder: Order | null;
};

const CourierOrdersContext = createContext<CourierOrdersValue | null>(null);

function isLive(order: Order) {
  return order.status !== 'delivered' && order.status !== 'canceled';
}

export function CourierOrdersProvider({ children }: { children: ReactNode }) {
  const { courierProfile } = useCourierAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!courierProfile) {
      setOrders([]);
      return;
    }
    return OrderRepository.subscribeForCourier(courierProfile.id, setOrders);
  }, [courierProfile?.id]);

  const value = useMemo<CourierOrdersValue>(() => {
    const offeredOrder = orders.find((o) => isLive(o) && o.courierAssignmentStatus === 'offered') ?? null;
    const activeOrder = orders.find((o) => isLive(o) && o.courierAssignmentStatus === 'accepted') ?? null;
    return { orders, offeredOrder, activeOrder };
  }, [orders]);

  return <CourierOrdersContext.Provider value={value}>{children}</CourierOrdersContext.Provider>;
}

export function useCourierOrders() {
  const value = useContext(CourierOrdersContext);
  if (!value) {
    throw new Error('useCourierOrders must be used within CourierOrdersProvider');
  }
  return value;
}
