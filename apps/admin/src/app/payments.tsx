import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';

// Exemple statique — le versement hebdomadaire aux vendeurs (et le suivi des
// IBAN) n'existe pas encore côté serveur ; les livreurs ont déjà un vrai
// solde (totalEarnedCents, visible dans l'écran Livreurs) mais ce n'est pas
// encore le cas des vendeurs.
function eur(n: number) {
  return (
    Math.round(n * 100) / 100
  ).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

const RATE = 0.15;
const VENDORS: [string, string, number, number, boolean][] = [
  ['Teranga Küche', 'DE89 •••• 4021', 2846.0, 24.8, false],
  ['Saffron Table', 'DE12 •••• 7765', 2112.4, 0, false],
  ['Baobab Grill', 'DE44 •••• 0318', 1904.5, 31.5, false],
  ['Épicerie Dakar', 'Nom du titulaire différent', 1268.0, 0, true],
  ['Mafé & Co', 'DE70 •••• 5590', 896.3, 16.4, false],
  ['Viertel Bäckerei', 'DE31 •••• 2284', 642.0, 0, false],
];
const HISTORY = [
  { period: '26 oct. – 1er nov.', paid: '2 novembre', count: 6, total: eur(7412.9) },
  { period: '19 – 25 octobre', paid: '26 octobre', count: 6, total: eur(6980.15) },
  { period: '12 – 18 octobre', paid: '19 octobre', count: 5, total: eur(6455.6) },
];

export default function PaymentsScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [tab, setTab] = useState<'week' | 'history'>('week');
  const [fixed, setFixed] = useState(false);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  const rows = VENDORS.map(([name, iban, gross, refund, needsFix]) => {
    const fee = Math.round(gross * RATE * 100) / 100;
    const net = Math.round((gross - fee - refund) * 100) / 100;
    const blocked = needsFix && !fixed;
    return { name, iban: needsFix && fixed ? 'IBAN vérifié aujourd’hui' : iban, gross, fee, refund, net, blocked };
  });
  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      fee: acc.fee + r.fee,
      refund: acc.refund + r.refund,
      net: acc.net + r.net,
      scheduled: acc.scheduled + (r.blocked ? 0 : r.net),
      blocked: acc.blocked + (r.blocked ? r.net : 0),
      blockedCount: acc.blockedCount + (r.blocked ? 1 : 0),
    }),
    { gross: 0, fee: 0, refund: 0, net: 0, scheduled: 0, blocked: 0, blockedCount: 0 }
  );

  return (
    <AdminScreen
      headerRight={
        <Text
          onPress={() => undefined}
          style={[styles.exportButton, { borderColor: theme.colors.border, borderRadius: theme.radii.md, color: theme.colors.text }]}>
          Exporter pour la compta
        </Text>
      }
      subtitle="Versements hebdomadaires aux vendeurs · semaine du 2 au 8 novembre · données d'exemple"
      title="Paiements">
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.summaryDark, { borderRadius: theme.radii.xl }]}>
          <Text style={styles.summaryDarkLabel}>Prochain versement · lun. 9 nov.</Text>
          <Text style={styles.summaryDarkValue}>{eur(totals.scheduled)}</Text>
          <Text style={styles.summaryDarkNote}>{rows.length - totals.blockedCount} vendeurs</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.errorTint, borderRadius: theme.radii.xl, borderWidth: 1 }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.error }]}>Bloqué</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{eur(totals.blocked)}</Text>
          <Text style={[styles.summaryNote, { color: theme.colors.textMuted }]}>
            {totals.blockedCount ? `${totals.blockedCount} vendeur · IBAN à vérifier` : 'Aucun versement bloqué'}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl, borderWidth: 1 }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Frais AoSell de la semaine</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{eur(totals.fee)}</Text>
          <Text style={[styles.summaryNote, { color: theme.colors.textMuted }]}>Taux d'exemple : 15 %</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl, borderWidth: 1 }]}>
          <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>Remboursements clients</Text>
          <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{eur(totals.refund)}</Text>
          <Text style={[styles.summaryNote, { color: theme.colors.textMuted }]}>Déduits du vendeur concerné</Text>
        </View>
      </View>

      <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
        <Text
          onPress={() => setTab('week')}
          style={[
            styles.tab,
            { borderRadius: theme.radii.sm, color: tab === 'week' ? theme.colors.text : theme.colors.textMuted },
            tab === 'week' && { backgroundColor: theme.colors.surface },
          ]}>
          Semaine en cours
        </Text>
        <Text
          onPress={() => setTab('history')}
          style={[
            styles.tab,
            { borderRadius: theme.radii.sm, color: tab === 'history' ? theme.colors.text : theme.colors.textMuted },
            tab === 'history' && { backgroundColor: theme.colors.surface },
          ]}>
          Versements passés
        </Text>
      </View>

      {tab === 'week' ? (
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          {rows.map((r, index) => (
            <View
              key={r.name}
              style={[
                styles.row,
                index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border },
                r.blocked && { backgroundColor: theme.colors.errorTint },
              ]}>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowName, { color: theme.colors.text }]}>{r.name}</Text>
                <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>{r.iban}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: theme.colors.text }]}>{eur(r.gross)}</Text>
              <Text style={[styles.rowAmount, { color: theme.colors.textMuted }]}>−{eur(r.fee)}</Text>
              <Text style={[styles.rowAmount, { color: theme.colors.text, fontWeight: '700' }]}>{eur(r.net)}</Text>
              {r.blocked ? (
                <Text
                  onPress={() => setFixed(true)}
                  style={[styles.fixButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.sm, color: theme.colors.onAccent }]}>
                  Vérifier l'IBAN
                </Text>
              ) : (
                <Text style={[styles.rowStatus, { color: theme.colors.success }]}>Programmé</Text>
              )}
            </View>
          ))}
          <View style={[styles.row, styles.totalRow, { borderTopColor: theme.colors.borderStrong }]}>
            <Text style={[styles.rowName, { color: theme.colors.text }]}>Total</Text>
            <Text style={[styles.rowAmount, { color: theme.colors.text, fontWeight: '700' }]}>{eur(totals.gross)}</Text>
            <Text style={[styles.rowAmount, { color: theme.colors.text, fontWeight: '700' }]}>{eur(totals.fee)}</Text>
            <Text style={[styles.rowAmount, { color: theme.colors.text, fontWeight: '700' }]}>{eur(totals.net)}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          {HISTORY.map((h, index) => (
            <View key={h.period} style={[styles.historyRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <Text style={[styles.rowName, { color: theme.colors.text, flex: 1 }]}>{h.period}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>Versé le {h.paid}</Text>
              <Text style={[styles.rowMeta, { color: theme.colors.textMuted }]}>{h.count} vendeurs</Text>
              <Text style={[styles.rowAmount, { color: theme.colors.text, fontWeight: '700' }]}>{h.total}</Text>
            </View>
          ))}
        </View>
      )}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  exportButton: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, fontWeight: '600', overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  summaryCard: { flexGrow: 1, flexBasis: 210, padding: 18, gap: 8 },
  summaryDark: { backgroundColor: '#14213D' },
  summaryDarkLabel: { color: '#C9CFDC', fontSize: 13, fontWeight: '600' },
  summaryDarkValue: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 28 },
  summaryDarkNote: { color: '#FFB400', fontSize: 13, fontWeight: '600' },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryValue: { fontFamily: 'Poppins_700Bold', fontSize: 28 },
  summaryNote: { fontSize: 13 },
  tabs: { flexDirection: 'row', gap: 4, padding: 4, alignSelf: 'flex-start' },
  tab: { paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, fontWeight: '600', overflow: 'hidden' },
  tableCard: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 13, fontWeight: '600' },
  rowMeta: { fontSize: 12 },
  rowAmount: { fontSize: 13, width: 90, textAlign: 'right' },
  rowStatus: { fontSize: 12, fontWeight: '600', width: 110, textAlign: 'right' },
  fixButton: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 8, textAlign: 'center', width: 130, overflow: 'hidden' },
  totalRow: { borderTopWidth: 2 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14, flexWrap: 'wrap' },
});
