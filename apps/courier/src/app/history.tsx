import { OrderRepository } from '@aosell/core';
import type { Order } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useCourierAuth } from '@/providers/courier-auth';

export default function HistoryScreen() {
  const { courierProfile } = useCourierAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!courierProfile) {
      return;
    }
    return OrderRepository.subscribeForCourier(courierProfile.id, setOrders);
  }, [courierProfile?.id]);

  if (!courierProfile) {
    return <Redirect href="/" />;
  }

  const delivered = orders.filter((order) => order.status === 'delivered');
  const totalEarnedCents = courierProfile.totalEarnedCents ?? 0;

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>Historique</Text>
      <Text style={styles.total}>Total gagné : {(totalEarnedCents / 100).toFixed(2)} €</Text>
      <ScrollView>
        {delivered.map((order) => (
          <View key={order.id} style={styles.row}>
            <Text style={styles.message}>
              {order.deliveryAddress.city} — {(order.total.amountCents / 100).toFixed(2)} {order.currency}
            </Text>
            <Text style={styles.message}>
              Commission : {((order.courierCommission?.amountCents ?? 0) / 100).toFixed(2)} {order.currency}
            </Text>
          </View>
        ))}
        {!delivered.length ? <Text style={styles.message}>Aucune livraison terminée encore.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 20, fontWeight: '700' },
  total: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDEDED', gap: 2 },
  message: { fontSize: 14, color: '#444444' },
});
