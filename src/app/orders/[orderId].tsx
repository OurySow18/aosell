import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useState } from 'react';

import { AppButton } from '@/components/ui/app-button';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatMoney, formatStatus } from '@/lib/utils/format';
import { getNextStatuses } from '@/lib/utils/order';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';
  const theme = useTheme();
  const { getOrderById, getSellerById, currentSellerProfile, advanceOrderStatus } = useAosell();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <AppScreen>
        <EmptyState title="Order not found" description="The requested order is unavailable." />
      </AppScreen>
    );
  }

  const isSellerOwner = currentSellerProfile?.id === order.sellerId;

  return (
    <AppScreen>
      <SectionTitle
        eyebrow="Order detail"
        title={order.id}
        description={`Handled by ${getSellerById(order.sellerId)?.brandName ?? 'seller'} with status transitions constrained by rules.`}
      />

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <StatusPill label={formatStatus(order.status)} tone="brand" />
        <ThemedText type="headline">{formatMoney(order.total)}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          Delivery to {order.deliveryAddress.fullName}, {order.deliveryAddress.line1}, {order.deliveryAddress.city}.
        </ThemedText>
      </View>

      <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText type="headline">Timeline</ThemedText>
        {order.timeline.map((entry, index) => (
          <View key={`${entry.status}-${index}`} style={styles.timelineRow}>
            <ThemedText type="button">{formatStatus(entry.status)}</ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {formatDate(entry.at)}
            </ThemedText>
          </View>
        ))}
      </View>

      {isSellerOwner ? (
        <View style={[styles.panel, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText type="headline">Seller actions</ThemedText>
          {getNextStatuses(order.status).map((status) => (
            <AppButton
              key={status}
              label={`Move to ${formatStatus(status)}`}
              variant={status === order.status ? 'ghost' : 'secondary'}
              disabled={pendingStatus !== null}
              onPress={() => {
                setPendingStatus(status);
                void advanceOrderStatus(order.id, status).finally(() => setPendingStatus(null));
              }}
            />
          ))}
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
});
