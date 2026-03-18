import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { OrderStatusTrack } from '@/components/orders/order-status-track';
import { AppScreen } from '@/components/ui/app-screen';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { getOrderStatusDescription, getOrderStatusLabel, getOrderStatusTone } from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function CheckoutSuccessScreen() {
  const theme = useTheme();
  const { t } = useLocale();
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';
  const { getOrderById } = useAosell();
  const order = getOrderById(orderId);
  const status = order?.status ?? 'pending_payment';

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <StatusPill label={getOrderStatusLabel(status)} tone={getOrderStatusTone(status)} />
          <View style={styles.heroCopy}>
            <ThemedText type="display">{t('checkoutSuccess.title')}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {order
                ? getOrderStatusDescription(order.status)
                : t('checkoutSuccess.fallbackDescription', { orderId })}
            </ThemedText>
          </View>
          <View style={styles.meta}>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {t('common.orderId')}
            </ThemedText>
            <ThemedText type="headline">{orderId}</ThemedText>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="headline">{t('checkoutSuccess.nextTitle')}</ThemedText>
          <OrderStatusTrack
            status={status}
            timelineStatuses={order?.timeline.map((entry) => entry.status) ?? ['created', 'pending_payment']}
          />
        </View>

        <View style={styles.actions}>
          <AppButton label={t('common.openOrder')} onPress={() => router.replace(`/orders/${orderId}`)} />
          <AppButton label={t('common.viewAllOrders')} variant="secondary" onPress={() => router.replace('/orders')} />
          <AppButton label={t('common.backHome')} variant="ghost" onPress={() => router.replace('/home')} />
        </View>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: '100%',
    justifyContent: 'center',
    gap: Spacing.lg,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  heroCopy: {
    gap: Spacing.sm,
  },
  meta: {
    gap: Spacing.xs,
  },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  actions: {
    gap: Spacing.md,
  },
});
