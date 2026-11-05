import { OrderRepository, SellerRepository } from '@aosell/core';
import type { Order, OrderStatus, SellerProfile } from '@aosell/core';
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

function relativeTime(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} j`;
}

export default function OrdersScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  useEffect(() => {
    if (status !== 'admin') return;
    return OrderRepository.subscribeAll(setOrders);
  }, [status]);
  useEffect(() => {
    if (status !== 'admin') return;
    return SellerRepository.subscribeAll(setSellers);
  }, [status]);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  const sellerName = (id: string) => sellers.find((s) => s.id === id)?.brandName ?? id.slice(0, 8);

  return (
    <AdminScreen subtitle="Toutes les commandes, triées par date" title={`Commandes (${orders.length})`}>
      <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        <View style={[styles.headerRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.headerCell, styles.colId, { color: theme.colors.textMuted }]}>N°</Text>
          <Text style={[styles.headerCell, styles.colVendor, { color: theme.colors.textMuted }]}>Vendeur</Text>
          <Text style={[styles.headerCell, styles.colLivraison, { color: theme.colors.textMuted }]}>Livraison</Text>
          <Text style={[styles.headerCell, styles.colAmount, { color: theme.colors.textMuted }]}>Montant</Text>
          <Text style={[styles.headerCell, styles.colStatus, { color: theme.colors.textMuted }]}>Statut</Text>
          <Text style={[styles.headerCell, styles.colAge, { color: theme.colors.textMuted }]}>Depuis</Text>
        </View>
        {orders.map((order, index) => (
          <View key={order.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <Text style={[styles.cell, styles.colId, { color: theme.colors.text, fontWeight: '700' }]}>#{order.id.slice(0, 6)}</Text>
            <Text numberOfLines={1} style={[styles.cell, styles.colVendor, { color: theme.colors.text }]}>
              {sellerName(order.sellerId)}
            </Text>
            <Text style={[styles.cell, styles.colLivraison, { color: theme.colors.textMuted }]}>
              {order.deliveryMode === 'aosell'
                ? order.courierId
                  ? `Livreur ${order.courierId.slice(0, 6)} (${order.courierAssignmentStatus ?? '—'})`
                  : 'Livreur à assigner'
                : 'Par le vendeur'}
            </Text>
            <Text style={[styles.cell, styles.colAmount, { color: theme.colors.text }]}>{(order.total.amountCents / 100).toFixed(2)} €</Text>
            <View style={styles.colStatus}>
              <StatusPill label={order.status} theme={theme} tone={toneForOrderStatus(order.status)} />
            </View>
            <Text style={[styles.cell, styles.colAge, { color: theme.colors.textMuted }]}>{relativeTime(order.createdAt)}</Text>
          </View>
        ))}
        {!orders.length ? <Text style={[styles.empty, { color: theme.colors.textMuted }]}>Aucune commande pour l'instant.</Text> : null}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  tableCard: { borderWidth: 1, overflow: 'hidden' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1 },
  headerCell: { fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  cell: { fontSize: 13 },
  colId: { width: 70 },
  colVendor: { flex: 1 },
  colLivraison: { width: 190 },
  colAmount: { width: 80, textAlign: 'right' },
  colStatus: { width: 110 },
  colAge: { width: 56, textAlign: 'right' },
  empty: { padding: 20, fontSize: 14, textAlign: 'center' },
});
