import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatMoney } from '@/lib/utils/format';
import {
  getOrderStatusDescription,
  getOrderStatusLabel,
  getOrderStatusTone,
} from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function OrdersScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const { currentUser, orders, sellers } = useAosell();

  if (!currentUser) {
    return (
      <AppScreen>
        <EmptyState
          title={t('ordersScreen.noAccountTitle')}
          description={t('ordersScreen.noAccountDescription')}
        />
        <AppButton
          label={t('ordersScreen.signInToView')}
          onPress={() =>
            router.push({
              pathname: '/auth',
              params: {
                mode: 'signin',
                role: 'buyer',
                returnTo: '/orders',
              },
            })
          }
        />
      </AppScreen>
    );
  }

  const userOrders = orders.filter((order) => order.buyerUserId === currentUser.id);
  const activeCount = userOrders.filter(
    (order) => !['delivered', 'canceled', 'refunded'].includes(order.status)
  ).length;
  const deliveredCount = userOrders.filter((order) => order.status === 'delivered').length;

  if (!userOrders.length) {
    return (
      <AppScreen>
        <EmptyState
          title={t('ordersScreen.emptyTitle')}
          description={t('ordersScreen.emptyDescription')}
        />
        <AppButton label={t('ordersScreen.exploreListings')} onPress={() => router.replace('/home')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('ordersScreen.eyebrow')}
        title={t('ordersScreen.title')}
        description={t('ordersScreen.description')}
      />

      <View style={[styles.heroCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.heroGlow, { backgroundColor: theme.gold }]} />
        <View style={styles.heroStats}>
          <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="label" themeColor="burntOrange">
              {t('ordersScreen.active')}
            </ThemedText>
            <ThemedText type="headline">{String(activeCount)}</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="label" themeColor="burntOrange">
              {t('ordersScreen.delivered')}
            </ThemedText>
            <ThemedText type="headline">{String(deliveredCount)}</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="label" themeColor="burntOrange">
              {t('ordersScreen.lifetime')}
            </ThemedText>
            <ThemedText type="headline">{String(userOrders.length)}</ThemedText>
          </View>
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
              style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
              onPress={() => router.push(`/orders/${order.id}`)}>
              <View style={styles.header}>
                <View style={styles.copy}>
                  <ThemedText type="headline">{sellerName ?? order.id}</ThemedText>
                  <ThemedText type="bodySmall" themeColor="textSecondary">
                    {leadItem?.titleSnapshot}
                    {itemCount > 1 ? ` ${t('ordersScreen.moreItems', { count: itemCount - 1 })}` : ''} · {formatDate(order.createdAt)}
                  </ThemedText>
                </View>
                <StatusPill
                  label={getOrderStatusLabel(order.status)}
                  tone={getOrderStatusTone(order.status)}
                />
              </View>
              <ThemedText type="body" themeColor="textSecondary">
                {getOrderStatusDescription(order.status)}
              </ThemedText>
              <View style={styles.footer}>
                <View style={styles.footerMeta}>
                  <ThemedText type="bodySmall" themeColor="textSecondary">
                    {t('ordersScreen.deliveryLabel', { mode: getDeliveryModeLabel(order.deliveryMode) })}
                  </ThemedText>
                  <ThemedText type="bodySmall" themeColor="textSecondary">
                    {order.deliveryAddress.city}
                  </ThemedText>
                </View>
                <ThemedText type="headline">{formatMoney(order.total)}</ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    opacity: 0.12,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
    minWidth: 140,
    flexGrow: 1,
  },
  list: {
    gap: Spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  copy: {
    gap: Spacing.xs,
    flexBasis: 220,
    flexGrow: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  footerMeta: {
    gap: Spacing.xs,
  },
});
