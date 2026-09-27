import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { getOrderStatusDescription, getOrderStatusLabel, getOrderStatusTone } from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';

export default function OrdersScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { currentUser, orders, sellers } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState title={t('ordersScreen.noAccountTitle')} description={t('ordersScreen.noAccountDescription')} />
        <AppButton
          label={t('ordersScreen.signInToView')}
          onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin', role: 'buyer', returnTo: '/orders' } })}
        />
      </AppScreen>
    );
  }

  const userOrders = orders.filter((order) => order.buyerUserId === currentUser.id);
  const activeCount = userOrders.filter((order) => !['delivered', 'canceled', 'refunded'].includes(order.status)).length;
  const deliveredCount = userOrders.filter((order) => order.status === 'delivered').length;

  if (!userOrders.length) {
    return (
      <AppScreen>
        <EmptyState title={t('ordersScreen.emptyTitle')} description={t('ordersScreen.emptyDescription')} />
        <AppButton label={t('ordersScreen.exploreListings')} onPress={() => router.replace('/home')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle eyebrow={t('ordersScreen.eyebrow')} title={t('ordersScreen.title')} description={t('ordersScreen.description')} />

      <View style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
        <View style={styles.heroStats}>
          <StatBlock theme={theme} label={t('ordersScreen.active')} value={String(activeCount)} />
          <StatBlock theme={theme} label={t('ordersScreen.delivered')} value={String(deliveredCount)} />
          <StatBlock theme={theme} label={t('ordersScreen.lifetime')} value={String(userOrders.length)} />
        </View>
      </View>

      <View style={styles.list}>
        {userOrders.map((order) => {
          const sellerName = sellers.find((seller) => seller.id === order.sellerId)?.brandName;
          const itemCount = order.items.reduce((total, item) => total + item.quantity, 0);
          const leadItem = order.items[0];

          return (
            <Pressable
              key={order.id}
              style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}
              onPress={() => router.push(`/orders/${order.id}`)}>
              <View style={styles.header}>
                <View style={styles.copy}>
                  <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                    {sellerName ?? order.id}
                  </Text>
                  <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>
                    {leadItem?.titleSnapshot}
                    {itemCount > 1 ? ` ${t('ordersScreen.moreItems', { count: itemCount - 1 })}` : ''} · {formatDate(order.createdAt)}
                  </Text>
                </View>
                <StatusPill label={getOrderStatusLabel(order.status)} tone={getOrderStatusTone(order.status)} />
              </View>
              <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
                {getOrderStatusDescription(order.status)}
              </Text>
              <View style={styles.footer}>
                <View style={styles.footerMeta}>
                  <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>
                    {t('ordersScreen.deliveryLabel', { mode: getDeliveryModeLabel(order.deliveryMode) })}
                  </Text>
                  <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{order.deliveryAddress.city}</Text>
                </View>
                <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                  {formatMoney(order.total)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}

type AppTheme = ReturnType<typeof useAppTheme>;

function StatBlock({ theme, label, value }: { theme: AppTheme; label: string; value: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
      <Text style={[styles.label, { color: theme.colors.accent, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: { borderWidth: 1, padding: 16 },
  heroStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { borderWidth: 1, padding: 16, gap: 4, minWidth: 140, flexGrow: 1 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 21 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
  list: { gap: 12 },
  card: { borderWidth: 1, padding: 16, gap: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  copy: { gap: 4, flexBasis: 220, flexGrow: 1 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  footerMeta: { gap: 4 },
});
