import { SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { useAppTheme } from '@/hooks/use-theme';
import { useCourierAuth } from '@/providers/courier-auth';
import { useCourierOrders } from '@/providers/courier-orders';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function GainsScreen() {
  const theme = useAppTheme();
  const { courierProfile } = useCourierAuth();
  const { orders } = useCourierOrders();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  useEffect(() => {
    return SellerRepository.subscribeAll(setSellers);
  }, []);

  if (!courierProfile) {
    return <Redirect href="/" />;
  }

  const delivered = orders
    .filter((o) => o.status === 'delivered')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const weekCutoff = Date.now() - WEEK_MS;
  const thisWeek = delivered.filter((o) => new Date(o.updatedAt).getTime() >= weekCutoff);
  const weekTotalCents = thisWeek.reduce((sum, o) => sum + (o.courierCommission?.amountCents ?? 0), 0);

  const sellerName = (id: string) => sellers.find((s) => s.id === id)?.brandName ?? 'Vendeur';

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.colors.text }]}>
        <Text style={styles.headerLabel}>7 derniers jours</Text>
        <Text style={styles.headerTotal}>{(weekTotalCents / 100).toFixed(2)} €</Text>
        <Text style={styles.headerNote}>
          {thisWeek.length} course{thisWeek.length > 1 ? 's' : ''} · solde total : {((courierProfile.totalEarnedCents ?? 0) / 100).toFixed(2)} €
        </Text>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Historique des livraisons</Text>
        {delivered.map((order) => (
          <View key={order.id} style={[styles.runRow, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.runTime, { color: theme.colors.textMuted }]}>{formatTime(order.updatedAt)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.runVendor, { color: theme.colors.text }]}>
                {sellerName(order.sellerId)} → {order.deliveryAddress.city}
              </Text>
            </View>
            <Text style={[styles.runGain, { color: theme.colors.text }]}>
              {((order.courierCommission?.amountCents ?? 0) / 100).toFixed(2)} €
            </Text>
          </View>
        ))}
        {!delivered.length ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted }]}>Aucune livraison terminée encore.</Text>
        ) : null}
      </ScrollView>

      <BottomNav active="gains" theme={theme} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 18, gap: 4 },
  headerLabel: { color: '#C9CFDC', fontSize: 13 },
  headerTotal: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 38, lineHeight: 44 },
  headerNote: { color: '#FFB400', fontSize: 13, fontWeight: '600' },
  body: { padding: 20, gap: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  runRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  runTime: { width: 44, fontSize: 13 },
  runVendor: { fontWeight: '600', fontSize: 14 },
  runGain: { fontWeight: '700', fontSize: 14 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 20 },
});
