import { CourierRepository } from '@aosell/core';
import type { CourierProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StatusPill } from '@/components/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useAdminAuth } from '@/providers/admin-auth';
import type { AppTheme } from '@/hooks/use-theme';

type Tab = 'pending' | 'active' | 'rejected';

function Tabs({
  tab,
  setTab,
  counts,
  theme,
  labels,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  counts: Record<Tab, number>;
  theme: AppTheme;
  labels: Record<Tab, string>;
}) {
  return (
    <View style={[styles.tabs, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
      {(['pending', 'active', 'rejected'] as Tab[]).map((item) => (
        <Text
          key={item}
          onPress={() => setTab(item)}
          style={[
            styles.tab,
            { borderRadius: theme.radii.sm, color: tab === item ? theme.colors.text : theme.colors.textMuted },
            tab === item && { backgroundColor: theme.colors.surface },
          ]}>
          {labels[item]} {counts[item]}
        </Text>
      ))}
    </View>
  );
}

export default function CouriersScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { status } = useAdminAuth();
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [tab, setTab] = useState<Tab>('pending');

  useEffect(() => {
    if (status !== 'admin') return;
    return CourierRepository.subscribeAll(setCouriers);
  }, [status]);

  const grouped = useMemo(
    () => ({
      pending: couriers.filter((c) => c.verificationStatus === 'pending' || c.verificationStatus === 'unverified'),
      active: couriers.filter((c) => c.verificationStatus === 'verified'),
      rejected: couriers.filter((c) => c.verificationStatus === 'rejected'),
    }),
    [couriers]
  );

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <AdminScreen subtitle={t('couriers.subtitle')} title={t('couriers.title', { count: couriers.length })}>
      <Tabs
        counts={{ pending: grouped.pending.length, active: grouped.active.length, rejected: grouped.rejected.length }}
        labels={{ pending: t('couriers.tabPending'), active: t('couriers.tabActive'), rejected: t('couriers.tabRejected') }}
        setTab={setTab}
        tab={tab}
        theme={theme}
      />

      {tab === 'pending' ? (
        <View style={styles.grid}>
          {grouped.pending.map((courier) => (
            <View
              key={courier.id}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
              <View style={styles.cardHead}>
                <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.pill }]}>
                  <Text style={[styles.avatarText, { color: theme.colors.text }]}>{courier.displayName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.cardName, { color: theme.colors.text }]}>{courier.displayName}</Text>
                  <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>
                    {courier.phoneNumber} · {courier.city}, {courier.countryCode}
                  </Text>
                  {courier.vehicleType ? <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>{courier.vehicleType}</Text> : null}
                </View>
              </View>
              <View style={styles.actions}>
                <Text
                  onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'verified')}
                  style={[styles.actionBtn, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.md, color: theme.colors.onAccent }]}>
                  {t('couriers.approve')}
                </Text>
                <Text
                  onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'rejected')}
                  style={[styles.actionBtn, styles.actionDanger, { borderColor: theme.colors.errorTint, borderRadius: theme.radii.md, color: theme.colors.error }]}>
                  {t('couriers.reject')}
                </Text>
              </View>
            </View>
          ))}
          {!grouped.pending.length ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted }]}>{t('couriers.emptyPending')}</Text>
          ) : null}
        </View>
      ) : (
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          {grouped[tab].map((courier, index) => (
            <View key={courier.id} style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <View style={styles.rowInfo}>
                <Text style={[styles.cardName, { color: theme.colors.text }]}>{courier.displayName}</Text>
                <Text style={[styles.cardMeta, { color: theme.colors.textMuted }]}>{courier.phoneNumber}</Text>
              </View>
              <StatusPill
                label={t(`domain.availability.${courier.availability}`)}
                theme={theme}
                tone={courier.availability === 'offline' ? 'neutral' : 'success'}
              />
              <Text style={[styles.rowCell, { color: theme.colors.text, fontWeight: '600' }]}>
                {((courier.totalEarnedCents ?? 0) / 100).toFixed(2)} €
              </Text>
              {tab === 'active' ? (
                <Text
                  onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'rejected')}
                  style={[styles.linkDanger, { color: theme.colors.error }]}>
                  {t('couriers.suspend')}
                </Text>
              ) : (
                <Text
                  onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'pending')}
                  style={[styles.link, { color: theme.colors.text }]}>
                  {t('couriers.review')}
                </Text>
              )}
            </View>
          ))}
          {!grouped[tab].length ? (
            <Text style={[styles.empty, { color: theme.colors.textMuted, padding: 20 }]}>{t('couriers.emptyList')}</Text>
          ) : null}
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
  avatar: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  cardName: { fontSize: 15, fontWeight: '600' },
  cardMeta: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, textAlign: 'center', fontSize: 14, fontWeight: '700', paddingVertical: 11, overflow: 'hidden' },
  actionDanger: { borderWidth: 1, backgroundColor: 'transparent' },
  tableCard: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 14 },
  rowInfo: { flex: 1 },
  rowCell: { fontSize: 13, width: 90, textAlign: 'right' },
  link: { fontSize: 13, fontWeight: '700' },
  linkDanger: { fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center' },
});
