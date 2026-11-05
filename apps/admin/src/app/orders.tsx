import { OrderRepository } from '@aosell/core';
import type { Order } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAdminAuth } from '@/providers/admin-auth';

export default function OrdersScreen() {
  const { status } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (status !== 'admin') {
      return;
    }
    return OrderRepository.subscribeAll(setOrders);
  }, [status]);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <AdminScreen title={`Commandes (${orders.length})`}>
      {orders.map((order) => (
        <View key={order.id} style={styles.row}>
          <Text style={styles.name}>
            #{order.id.slice(0, 8)} · {(order.total.amountCents / 100).toFixed(2)} {order.currency}
          </Text>
          <Text style={styles.meta}>
            {order.status} · livraison {order.deliveryMode}
            {order.deliveryMode === 'aosell'
              ? ` · livreur: ${order.courierId ? order.courierId.slice(0, 8) : 'aucun'} (${order.courierAssignmentStatus ?? '—'})`
              : ''}
          </Text>
        </View>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDEDED', gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, color: '#666666' },
});
