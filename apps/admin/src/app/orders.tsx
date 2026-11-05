import { OrderRepository } from '@aosell/core';
import type { Order, OrderStatus } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StatusPill } from '@/components/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';

function toneForOrderStatus(status: OrderStatus) {
  if (status === 'delivered') return 'success' as const;
  if (status === 'canceled' || status === 'refunded') return 'error' as const;
  if (status === 'created' || status === 'pending_payment') return 'neutral' as const;
  return 'warning' as const;
}

export default function OrdersScreen() {
  const theme = useAppTheme();
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
      <View style={[styles.list, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        {orders.map((order, index) => (
          <View
            key={order.id}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                #{order.id.slice(0, 8)} · {(order.total.amountCents / 100).toFixed(2)} {order.currency}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
                livraison {order.deliveryMode}
                {order.deliveryMode === 'aosell'
                  ? ` · livreur: ${order.courierId ? order.courierId.slice(0, 8) : 'aucun'} (${order.courierAssignmentStatus ?? '—'})`
                  : ''}
              </Text>
            </View>
            <StatusPill label={order.status} theme={theme} tone={toneForOrderStatus(order.status)} />
          </View>
        ))}
        {!orders.length ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
            Aucune commande pour l'instant.
          </Text>
        ) : null}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingHorizontal: 18, paddingVertical: 14 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 17 },
  empty: { padding: 20, fontSize: 14, textAlign: 'center' },
});
