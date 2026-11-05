import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { OrderStatusTrack } from '@/components/orders/order-status-track';
import { AppScreen } from '@/components/ui/app-screen';
import { StatusPill } from '@/components/ui/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getOrderStatusDescription, getOrderStatusLabel, getOrderStatusTone } from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';

export default function CheckoutSuccessScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';
  const { getOrderById } = useAosell();
  const order = getOrderById(orderId);
  const status = order?.status ?? 'pending_payment';

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={[styles.hero, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
          <StatusPill label={getOrderStatusLabel(status)} tone={getOrderStatusTone(status)} />
          <View style={styles.heroCopy}>
            <Text style={[styles.display, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
              {t('checkoutSuccess.title')}
            </Text>
            <Text style={[styles.body, { color: theme.colors.textMuted, fontFamily: theme.typography.body.fontFamily }]}>
              {order ? getOrderStatusDescription(order.status) : t('checkoutSuccess.fallbackDescription', { orderId })}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.bodySmall, { color: theme.colors.textMuted }]}>{t('common.orderId')}</Text>
            <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{orderId}</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
          <Text style={[styles.heading, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('checkoutSuccess.nextTitle')}
          </Text>
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
  container: { minHeight: '100%', justifyContent: 'center', gap: 16, maxWidth: 720, alignSelf: 'center', width: '100%' },
  hero: { borderWidth: 1, padding: 20, gap: 12 },
  heroCopy: { gap: 8 },
  meta: { gap: 4 },
  panel: { borderWidth: 1, padding: 20, gap: 16 },
  actions: { gap: 12 },
  display: { fontSize: 28, lineHeight: 34 },
  heading: { fontSize: 17, lineHeight: 22 },
  body: { fontSize: 15, lineHeight: 22 },
  bodySmall: { fontSize: 13, lineHeight: 18 },
});
