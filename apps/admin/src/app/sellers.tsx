import { SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';
import type { AppTheme } from '@/hooks/use-theme';

type Tab = 'pending' | 'active' | 'rejected';

function Tabs({ tab, setTab, counts, theme }: { tab: Tab; setTab: (t: Tab) => void; counts: Record<Tab, number>; theme: AppTheme }) {
  const labels: Record<Tab, string> = { pending: 'En attente', active: 'Actifs', rejected: 'Rejetés' };
  return (
    <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
      {(['pending', 'active', 'rejected'] as Tab[]).map((t) => (
        <Text
          key={t}
          onPress={() => setTab(t)}
          style={[
            styles.tab,
            { borderRadius: theme.radii.sm, color: tab === t ? theme.colors.text : theme.colors.textMuted },
            tab === t && { backgroundColor: theme.colors.surface },
          ]}>
          {labels[t]} {counts[t]}
        </Text>
      ))}
    </View>
  );
}

export default function SellersScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [tab, setTab] = useState<Tab>('pending');

  useEffect(() => {
    if (status !== 'admin') return;
    return SellerRepository.subscribeAll(setSellers);
  }, [status]);

  const grouped = useMemo(
    () => ({
      pending: sellers.filter((s) => s.verificationStatus === 'pending' || s.verificationStatus === 'unverified'),
      active: sellers.filter((s) => s.verificationStatus === 'verified'),
      rejected: sellers.filter((s) => s.verificationStatus === 'rejected'),
    }),
    [sellers]
  );

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <AdminScreen subtitle="Restaurants, traiteurs et commerces de Bremen" title={`Vendeurs (${sellers.length})`}>
      <Tabs
        counts={{ pending: grouped.pending.length, active: grouped.active.length, rejected: grouped.rejected.length }}
        setTab={setTab}
        tab={tab}
        theme={theme}
      />

      {tab === 'pending' ? (
        <View style={styles.grid}>
          {grouped.pending.map((seller) => (
            <View
              key={seller.id}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
              <View style={styles.cardHead}>
                <View style={[styles.logo, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
                  <Text style={[styles.logoText, { color: theme.colors.text }]}>{seller.brandName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>{seller.brandName}</Text>
                  <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>
                    {seller.type} · {seller.city}, {seller.countryCode}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Text
                  onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'verified')}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, color: theme.colors.onAccent }]}>
                  Valider
                </Text>
                <Text
                  onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'rejected')}
                  style={[styles.actionBtn, styles.actionDanger, { borderColor: theme.colors.errorTint, borderRadius: theme.radii.md, color: theme.colors.error }]}>
                  Refuser
                </Text>
              </View>
            </View>
          ))}
          {!grouped.pending.length ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>Aucune demande en attente.</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          {grouped[tab].map((seller, index) => (
            <View key={seller.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <View style={styles.rowInfo}>
                <Text style={[styles.cardName, { color: theme.colors.text }]}>{seller.brandName}</Text>
                <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>{seller.type}</Text>
              </View>
              <Text style={[styles.rowCell, { color: theme.colors.textMuted }]}>
                {seller.city}, {seller.countryCode}
              </Text>
              {tab === 'active' ? (
                <Text
                  onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'rejected')}
                  style={[styles.linkDanger, { color: theme.colors.error }]}>
                  Suspendre
                </Text>
              ) : (
                <Text
                  onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'pending')}
                  style={[styles.link, { color: theme.colors.text }]}>
                  Réexaminer
                </Text>
              )}
            </View>
          ))}
          {!grouped[tab].length ? <Text style={[styles.empty, { color: theme.colors.textMuted, padding: 20 }]}>Aucun vendeur ici.</Text> : null}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: 4, padding: 4, alignSelf: 'flex-start' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  card: { flexGrow: 1, flexBasis: 280, maxWidth: 360, borderWidth: 1, padding: 20, gap: 16 },
  cardHead: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  logo: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 15, fontWeight: '700' },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardMeta: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 11, overflow: 'hidden' },
  actionDanger: { borderWidth: 1, backgroundColor: 'transparent' },
  tableCard: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 },
  rowInfo: { flex: 1 },
  rowCell: { fontSize: 13, width: 140 },
  link: { fontSize: 13, fontWeight: '700' },
  linkDanger: { fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center' },
});
