import { CourierRepository, OrderRepository, SellerRepository } from '@aosell/core';
import type { CourierProfile, Order, SellerProfile } from '@aosell/core';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StatusPill } from '@/components/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useAdminAuth } from '@/providers/admin-auth';
import type { AppTheme } from '@/hooks/use-theme';

// Exemple statique — aucune agrégation horaire ou par vendeur n'existe encore
// côté serveur. Les autres chiffres de cet écran (commandes, vendeurs,
// livreurs) viennent de Firestore en direct.
const HOURLY_EXAMPLE: [number, number][] = [
  [10, 4], [11, 9], [12, 22], [13, 19], [14, 8], [15, 6],
  [16, 7], [17, 11], [18, 21], [19, 29], [20, 26], [21, 15],
];
const TOP_SELLERS_EXAMPLE = [
  { rank: 1, name: 'Teranga Küche', orders: 31, rev: '612 €' },
  { rank: 2, name: 'Saffron Table', orders: 24, rev: '398 €' },
  { rank: 3, name: 'Baobab Grill', orders: 19, rev: '421 €' },
  { rank: 4, name: 'Épicerie Dakar', orders: 12, rev: '356 €' },
];

function relativeMinutes(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.round(minutes / 60)} h`;
}

function Kpi({ label, value, theme }: { label: string; value: string; theme: AppTheme }) {
  return (
    <View style={[styles.kpi, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
      <Text style={[styles.kpiLabel, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.bodySemi }]}>{label}</Text>
      <Text style={[styles.kpiValue, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{value}</Text>
    </View>
  );
}

function ToDoRow({
  count,
  title,
  subtitle,
  href,
  theme,
  tint,
}: {
  count: number;
  title: string;
  subtitle: string;
  href: Parameters<typeof Link>[0]['href'];
  theme: AppTheme;
  tint: string;
}) {
  return (
    <Link asChild href={href}>
      <Pressable style={StyleSheet.flatten([styles.todoRow, { backgroundColor: tint, borderRadius: theme.radii.md }])}>
        <Text style={[styles.todoCount, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{count}</Text>
        <View style={styles.todoCopy}>
          <Text style={[styles.todoTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>{title}</Text>
          <Text style={[styles.todoSubtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

export default function DashboardScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { status } = useAdminAuth();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (status !== 'admin') return;
    return SellerRepository.subscribeAll(setSellers);
  }, [status]);
  useEffect(() => {
    if (status !== 'admin') return;
    return CourierRepository.subscribeAll(setCouriers);
  }, [status]);
  useEffect(() => {
    if (status !== 'admin') return;
    return OrderRepository.subscribeAll(setOrders);
  }, [status]);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  const pendingSellers = sellers.filter((s) => s.verificationStatus === 'pending').length;
  const pendingCouriers = couriers.filter((c) => c.verificationStatus === 'pending').length;
  const activeSellers = sellers.filter((s) => s.verificationStatus === 'verified').length;
  const onlineCouriers = couriers.filter((c) => c.availability !== 'offline');
  const availableCouriers = couriers.filter((c) => c.availability === 'available').length;
  const onDeliveryCouriers = couriers.filter((c) => c.availability === 'on_delivery').length;
  const liveOrders = orders.filter((o) => !['delivered', 'canceled', 'refunded'].includes(o.status));
  const unassignedDeliveries = liveOrders.filter(
    (o) => o.deliveryMode === 'aosell' && (!o.courierId || o.courierAssignmentStatus === 'offered')
  ).length;
  const sellerName = (id: string) => sellers.find((s) => s.id === id)?.brandName ?? id.slice(0, 8);

  const maxBar = Math.max(...HOURLY_EXAMPLE.map(([, v]) => v));

  return (
    <AdminScreen subtitle={t('dashboard.subtitle')} title={t('dashboard.title')}>
      <View style={styles.kpiRow}>
        <Kpi label={t('dashboard.kpiOrders')} theme={theme} value={String(orders.length)} />
        <Kpi label={t('dashboard.kpiActiveSellers')} theme={theme} value={String(activeSellers)} />
        <Kpi label={t('dashboard.kpiCouriersOnline')} theme={theme} value={`${onlineCouriers.length} / ${couriers.length}`} />
        <Kpi label={t('dashboard.kpiUnassigned')} theme={theme} value={String(unassignedDeliveries)} />
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>
              {t('dashboard.chartTitle')}
            </Text>
            <Text style={[styles.chartNote, { color: theme.colors.textMuted }]}>{t('dashboard.chartNote')}</Text>
          </View>
          <View style={styles.bars}>
            {HOURLY_EXAMPLE.map(([hour, value], index) => {
              const last = index === HOURLY_EXAMPLE.length - 1;
              return (
                <View key={hour} style={styles.barColumn}>
                  <Text style={[styles.barValue, { color: theme.colors.textMuted }]}>{value}</Text>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: Math.round((value / maxBar) * 140),
                        backgroundColor: last ? theme.colors.accentTint : theme.colors.accent,
                        borderRadius: theme.radii.xs,
                      },
                    ]}
                  />
                  <Text style={[styles.barHour, { color: theme.colors.textMuted }]}>{hour}h</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.todoCol}>
          <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>{t('dashboard.toDo')}</Text>
          <ToDoRow
            count={pendingSellers}
            href="/sellers"
            subtitle={t('dashboard.toDoSellersSubtitle')}
            theme={theme}
            tint={theme.colors.warningTint}
            title={t('dashboard.toDoSellersTitle')}
          />
          <ToDoRow
            count={pendingCouriers}
            href="/couriers"
            subtitle={t('dashboard.toDoCouriersSubtitle')}
            theme={theme}
            tint={theme.colors.warningTint}
            title={t('dashboard.toDoCouriersTitle')}
          />
          <ToDoRow
            count={5}
            href="/moderation"
            subtitle={t('dashboard.toDoModerationSubtitle')}
            theme={theme}
            tint={theme.colors.surfaceMuted}
            title={t('dashboard.toDoModerationTitle')}
          />
          <ToDoRow
            count={1}
            href="/payments"
            subtitle={t('dashboard.toDoPaymentsSubtitle')}
            theme={theme}
            tint={theme.colors.surfaceMuted}
            title={t('dashboard.toDoPaymentsTitle')}
          />
        </View>
      </View>

      <View style={styles.twoCol}>
        <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>
              {t('dashboard.liveOrders', { count: liveOrders.length })}
            </Text>
            <Link href="/orders" style={[styles.link, { color: theme.colors.text }]}>
              {t('dashboard.seeAll')}
            </Link>
          </View>
          {liveOrders.slice(0, 6).map((order, index) => (
            <View key={order.id} style={[styles.liveRow, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
              <Text style={[styles.liveId, { color: theme.colors.text }]}>#{order.id.slice(0, 6)}</Text>
              <Text numberOfLines={1} style={[styles.liveVendor, { color: theme.colors.text }]}>
                {sellerName(order.sellerId)}
              </Text>
              <Text style={[styles.liveTotal, { color: theme.colors.text }]}>{(order.total.amountCents / 100).toFixed(2)} €</Text>
              <StatusPill label={t(`domain.orderStatus.${order.status}`)} theme={theme} tone="neutral" />
              <Text style={[styles.liveAge, { color: theme.colors.textMuted }]}>{relativeMinutes(order.createdAt)}</Text>
            </View>
          ))}
          {!liveOrders.length ? (
            <Text style={[styles.chartNote, { color: theme.colors.textMuted, padding: 16 }]}>{t('dashboard.noLiveOrders')}</Text>
          ) : null}
        </View>

        <View style={styles.todoCol}>
          <View style={[styles.courierCard, { backgroundColor: theme.colors.text, borderRadius: theme.radii.xl }]}>
            <Text style={styles.courierTitle}>{t('dashboard.couriersOnline')}</Text>
            <View style={styles.courierBig}>
              <Text style={styles.courierNumber}>{onlineCouriers.length}</Text>
              <Text style={styles.courierOf}>{t('dashboard.ofRegistered', { count: couriers.length })}</Text>
            </View>
            <View style={styles.courierLegend}>
              <Text style={styles.courierLegendItem}>● {t('dashboard.onDelivery', { count: onDeliveryCouriers })}</Text>
              <Text style={styles.courierLegendItem}>● {t('dashboard.available', { count: availableCouriers })}</Text>
            </View>
          </View>
          <View style={[styles.tableCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl, padding: 20, gap: 10 }]}>
            <Text style={[styles.cardTitle, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.heading }]}>
              {t('dashboard.topSellers')}
            </Text>
            <Text style={[styles.chartNote, { color: theme.colors.textMuted }]}>{t('dashboard.topSellersNote')}</Text>
            {TOP_SELLERS_EXAMPLE.map((row) => (
              <View key={row.rank} style={styles.topRow}>
                <Text style={[styles.topRank, { color: theme.colors.textMuted }]}>{row.rank}</Text>
                <Text numberOfLines={1} style={[styles.topName, { color: theme.colors.text }]}>
                  {row.name}
                </Text>
                <Text style={[styles.topMeta, { color: theme.colors.textMuted }]}>
                  {row.orders} {t('dashboard.ordersAbbrev')}
                </Text>
                <Text style={[styles.topMeta, { color: theme.colors.text, fontWeight: '700' }]}>{row.rev}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  kpiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  kpi: { flexGrow: 1, flexBasis: 200, borderWidth: 1, padding: 18, gap: 8 },
  kpiLabel: { fontSize: 13 },
  kpiValue: { fontSize: 28 },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' },
  chartCard: { flexGrow: 2, flexBasis: 520, borderWidth: 1, padding: 20, gap: 16 },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 17 },
  chartNote: { fontSize: 12 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 180 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 10, fontWeight: '600' },
  bar: { width: '100%', maxWidth: 28 },
  barHour: { fontSize: 10 },

  todoCol: { flexGrow: 1, flexBasis: 300, gap: 10 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  todoCount: { fontSize: 20, width: 28 },
  todoCopy: { flex: 1, gap: 2 },
  todoTitle: { fontSize: 14 },
  todoSubtitle: { fontSize: 12 },

  tableCard: { flexGrow: 2, flexBasis: 520, borderWidth: 1, overflow: 'hidden' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  liveId: { fontSize: 13, fontWeight: '700', width: 64 },
  liveVendor: { fontSize: 13, flex: 1 },
  liveTotal: { fontSize: 13, fontWeight: '600', width: 70, textAlign: 'right' },
  liveAge: { fontSize: 12, width: 48, textAlign: 'right' },
  link: { fontSize: 13, fontWeight: '700' },

  courierCard: { padding: 20, gap: 14 },
  courierTitle: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 17 },
  courierBig: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  courierNumber: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 32 },
  courierOf: { color: '#C9CFDC', fontSize: 13 },
  courierLegend: { flexDirection: 'row', gap: 16 },
  courierLegendItem: { color: '#E8EBF2', fontSize: 12 },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topRank: { width: 16, fontSize: 13, fontWeight: '600' },
  topName: { flex: 1, fontSize: 13, fontWeight: '600' },
  topMeta: { fontSize: 12 },
});
