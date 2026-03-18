import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { OrderStatus } from '@/types/domain';

import { AppButton } from '@/components/ui/app-button';
import { OrderStatusTrack } from '@/components/orders/order-status-track';
import { AppScreen } from '@/components/ui/app-screen';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionTitle } from '@/components/ui/section-title';
import { StatusPill } from '@/components/ui/status-pill';
import { Radius, Spacing } from '@/constants/theme';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { getPrimaryListingImage } from '@/lib/utils/listing-media';
import { getNextStatuses } from '@/lib/utils/order';
import {
  getOrderStatusDescription,
  getOrderStatusLabel,
  getOrderStatusTone,
  isTerminalOrderStatus,
} from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';
import { ThemedText } from '@/components/themed-text';

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';
  const theme = useTheme();
  const { t } = useLocale();
  const { getOrderById, getSellerById, getListingById, currentSellerProfile, advanceOrderStatus } =
    useAosell();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <AppScreen>
        <EmptyState title={t('orderDetail.notFoundTitle')} description={t('orderDetail.notFoundDescription')} />
      </AppScreen>
    );
  }

  const seller = getSellerById(order.sellerId);
  const isSellerOwner = currentSellerProfile?.id === order.sellerId;
  const timelineStatuses = order.timeline.map((entry) => entry.status);
  const availableSellerStatuses = getNextStatuses(order.status).filter((status) => status !== order.status);

  return (
    <AppScreen>
      <SectionTitle
        eyebrow={t('orderDetail.eyebrow')}
        title={seller?.brandName ?? order.id}
        description={t('orderDetail.description', {
          orderId: order.id,
          count: order.items.reduce((total, item) => total + item.quantity, 0),
        })}
      />

      <View style={[styles.hero, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={[styles.heroGlow, { backgroundColor: theme.gold }]} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <StatusPill
              label={getOrderStatusLabel(order.status)}
              tone={getOrderStatusTone(order.status)}
            />
            <ThemedText type="title">{formatMoney(order.total)}</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {getOrderStatusDescription(order.status)}
            </ThemedText>
          </View>
          <View style={styles.heroMeta}>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {t('orderDetail.orderedOn', { date: formatDate(order.createdAt) })}
            </ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {t('orderDetail.deliveryMode', { mode: getDeliveryModeLabel(order.deliveryMode) })}
            </ThemedText>
          </View>
        </View>
        {isTerminalOrderStatus(order.status) ? (
          <View style={[styles.alertCard, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="label" themeColor="burntOrange">
              {t('orderDetail.finalState')}
            </ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              {t('orderDetail.finalDescription')}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.layout}>
        <View style={styles.mainColumn}>
          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('orderDetail.statusTimeline')}</ThemedText>
            <OrderStatusTrack status={order.status} timelineStatuses={timelineStatuses} />
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('orderDetail.itemsTitle')}</ThemedText>
            <View style={styles.itemList}>
              {order.items.map((item) => {
                const listing = getListingById(item.listingId);
                const previewUrl = item.imageUrl ?? (listing ? getPrimaryListingImage(listing)?.url : undefined);
                const lineTotal = {
                  amountCents: item.quantity * item.unitPriceSnapshot.amountCents,
                  currency: item.unitPriceSnapshot.currency,
                };

                return (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={[styles.preview, { backgroundColor: theme.backgroundSelected }]}>
                      {previewUrl ? (
                        <Image
                          contentFit="cover"
                          source={{ uri: previewUrl }}
                          style={StyleSheet.absoluteFillObject}
                          transition={200}
                        />
                      ) : null}
                    </View>
                    <View style={styles.itemCopy}>
                      <ThemedText type="button">{item.titleSnapshot}</ThemedText>
                      <ThemedText type="bodySmall" themeColor="textSecondary">
                        {t('orderDetail.qtyEach', {
                          count: item.quantity,
                          price: formatMoney(item.unitPriceSnapshot),
                        })}
                      </ThemedText>
                    </View>
                    <ThemedText type="button">{formatMoney(lineTotal)}</ThemedText>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.sideColumn}>
          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('orderDetail.deliveryAddress')}</ThemedText>
            <ThemedText type="body">{order.deliveryAddress.fullName}</ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {order.deliveryAddress.line1}
            </ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
            </ThemedText>
            <ThemedText type="bodySmall" themeColor="textSecondary">
              {order.deliveryAddress.phoneNumber}
            </ThemedText>
            {order.deliveryAddress.instructions ? (
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('orderDetail.note', { note: order.deliveryAddress.instructions })}
              </ThemedText>
            ) : null}
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ThemedText type="headline">{t('orderDetail.orderTotals')}</ThemedText>
            <SummaryRow label={t('common.subtotal')} value={formatMoney(order.subtotal)} />
            <SummaryRow label={t('common.delivery')} value={formatMoney(order.deliveryFee)} />
            <SummaryRow label={t('common.total')} value={formatMoney(order.total)} />
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
              <ThemedText type="headline">{t('orderDetail.orderUpdates')}</ThemedText>
            {order.timeline.map((entry, index) => (
              <View key={`${entry.status}-${index}`} style={styles.auditRow}>
                <View style={styles.auditCopy}>
                  <ThemedText type="button">{getOrderStatusLabel(entry.status)}</ThemedText>
                  {entry.note ? (
                    <ThemedText type="bodySmall" themeColor="textSecondary">
                      {entry.note}
                    </ThemedText>
                  ) : null}
                </View>
                <ThemedText type="bodySmall" themeColor="textSecondary">
                  {formatDate(entry.at)}
                </ThemedText>
              </View>
            ))}
          </View>

          {isSellerOwner && availableSellerStatuses.length ? (
            <View
              style={[
                styles.panel,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText type="headline">{t('orderDetail.sellerActions')}</ThemedText>
              <ThemedText type="bodySmall" themeColor="textSecondary">
                {t('orderDetail.sellerActionsHint')}
              </ThemedText>
              {availableSellerStatuses.map((status) => (
                <AppButton
                  key={status}
                  label={t('orderDetail.moveTo', { status: getOrderStatusLabel(status) })}
                  variant="secondary"
                  disabled={pendingStatus !== null}
                  onPress={() => {
                    setPendingStatus(status);
                    void advanceOrderStatus(order.id, status).finally(() => setPendingStatus(null));
                  }}
                />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </AppScreen>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="body" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="headline">{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -100,
    right: -80,
    opacity: 0.45,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  heroCopy: {
    gap: Spacing.sm,
    flexBasis: 320,
    flexGrow: 1,
  },
  heroMeta: {
    gap: Spacing.xs,
  },
  alertCard: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  layout: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  mainColumn: {
    flexBasis: 520,
    flexGrow: 1.2,
    minWidth: 300,
    gap: Spacing.lg,
  },
  sideColumn: {
    flexBasis: 320,
    flexGrow: 0.9,
    minWidth: 280,
    gap: Spacing.lg,
  },
  panel: {
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  itemList: {
    gap: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  preview: {
    width: 56,
    height: 56,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  itemCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'center',
  },
  auditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  auditCopy: {
    gap: Spacing.xs,
    flex: 1,
  },
});
