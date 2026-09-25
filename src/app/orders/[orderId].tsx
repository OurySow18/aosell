import { router, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { getDeliveryModeLabel } from '@/lib/i18n';
import { formatDate, formatMoney } from '@/lib/utils/format';
import { getNextStatuses } from '@/lib/utils/order';
import {
  getOrderProgressSteps,
  getOrderStatusDescription,
  getOrderStatusLabel,
  isTerminalOrderStatus,
} from '@/lib/utils/order-status';
import { useAosell } from '@/providers/aosell-provider';
import type { OrderStatus } from '@/types/domain';

type AppTheme = ReturnType<typeof useAppTheme>;

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ orderId?: string | string[] }>();
  const orderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId ?? '';
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { getOrderById, getSellerById, currentSellerProfile, advanceOrderStatus } = useAosell();
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);
  const order = getOrderById(orderId);

  if (!order) {
    return (
      <SafeAreaView style={[styles.notFound, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.notFoundTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
          {t('orderDetail.notFoundTitle')}
        </Text>
        <Text style={[styles.notFoundBody, { color: theme.colors.textMuted }]}>{t('orderDetail.notFoundDescription')}</Text>
      </SafeAreaView>
    );
  }

  const seller = getSellerById(order.sellerId);
  const isSellerOwner = currentSellerProfile?.id === order.sellerId;
  const isTerminal = isTerminalOrderStatus(order.status);
  const steps = getOrderProgressSteps(order.status, order.timeline.map((entry) => entry.status));
  const availableSellerStatuses = getNextStatuses(order.status).filter((status) => status !== order.status);

  // Simple 3-node journey indicator (boutique → en route → toi) — not a live
  // map, no courier position data exists anywhere in this app yet.
  const journeyStage = ['created', 'pending_payment', 'paid', 'confirmed', 'preparing'].includes(order.status)
    ? 0
    : order.status === 'out_for_delivery'
      ? 1
      : 2;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.background }}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.roundButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <SymbolView tintColor={theme.colors.text} size={20} name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.headerTitle, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>
              {seller?.brandName ?? t('orderDetail.eyebrow')}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textMuted }]}>
              {t('orderDetail.orderedOn', { date: formatDate(order.createdAt) })}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 + insets.bottom, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Status journey (replaces the live map — no position data exists) */}
        {!isTerminal ? (
          <View style={[styles.journeyCard, { backgroundColor: theme.colors.text, borderRadius: theme.radii.xl }]}>
            <View style={styles.journeyRow}>
              <JourneyNode icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }} label={t('orderDetail.journeyStore')} active={journeyStage >= 0} current={journeyStage === 0} theme={theme} />
              <View style={[styles.journeyLine, { backgroundColor: journeyStage >= 1 ? theme.colors.accent : 'rgba(255,255,255,0.24)' }]} />
              <JourneyNode icon={{ ios: 'bicycle', android: 'pedal_bike', web: 'pedal_bike' }} label={t('orderDetail.journeyOnTheWay')} active={journeyStage >= 1} current={journeyStage === 1} theme={theme} />
              <View style={[styles.journeyLine, { backgroundColor: journeyStage >= 2 ? theme.colors.accent : 'rgba(255,255,255,0.24)' }]} />
              <JourneyNode icon={{ ios: 'house', android: 'home', web: 'home' }} label={t('orderDetail.journeyHome')} active={journeyStage >= 2} current={journeyStage === 2} theme={theme} />
            </View>
          </View>
        ) : null}

        {/* Hero status */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.etaLabel, { color: theme.colors.textMuted }]}>{t('orderDetail.currentStatus')}</Text>
          <Text style={[styles.etaValue, { color: theme.colors.text, fontFamily: theme.typography.display.fontFamily }]}>
            {getOrderStatusLabel(order.status)}
          </Text>
          <View style={[styles.etaBadge, { backgroundColor: theme.colors.accentTint }]}>
            <Text style={[styles.etaBadgeText, { color: theme.colors.text, fontFamily: theme.typography.micro.fontFamily }]}>
              {getOrderStatusDescription(order.status)}
            </Text>
          </View>
        </View>

        {/* Timeline */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('orderDetail.statusTimeline')}
          </Text>
          <View style={styles.timeline}>
            {steps.map((step, index) => (
              <View key={step.status} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <TimelineDot state={step.state} theme={theme} />
                  {index < steps.length - 1 ? (
                    <View style={[styles.timelineLine, { backgroundColor: step.state === 'complete' ? theme.colors.text : theme.colors.borderStrong }]} />
                  ) : null}
                </View>
                <View style={styles.timelineCopy}>
                  <Text
                    style={[
                      styles.timelineLabel,
                      {
                        color: step.state === 'upcoming' ? theme.colors.textMuted : theme.colors.text,
                        fontFamily: step.state === 'current' ? theme.typography.label.fontFamily : theme.typography.caption.fontFamily,
                      },
                    ]}>
                    {step.label}
                  </Text>
                  {step.state !== 'upcoming' ? (
                    <Text style={[styles.timelineDescription, { color: theme.colors.textMuted }]}>{step.description}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        {seller ? (
          <View style={[styles.card, styles.contactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <View style={[styles.contactAvatar, { backgroundColor: theme.colors.accentTint }]}>
              <Text style={[styles.contactAvatarText, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
                {seller.brandName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.contactCopy}>
              <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{seller.brandName}</Text>
              <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>{getDeliveryModeLabel(order.deliveryMode)}</Text>
            </View>
            {seller.phoneNumber ? (
              <Pressable
                onPress={() => void Linking.openURL(`tel:${seller.phoneNumber}`)}
                style={[styles.contactButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <SymbolView tintColor={theme.colors.text} size={18} name={{ ios: 'phone', android: 'call', web: 'call' }} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Items */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('orderDetail.itemsTitle')}
          </Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={[styles.itemName, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]} numberOfLines={1}>
                {item.quantity}× {item.titleSnapshot}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                {formatMoney({ amountCents: item.quantity * item.unitPriceSnapshot.amountCents, currency: item.unitPriceSnapshot.currency })}
              </Text>
            </View>
          ))}
          <View style={[styles.rowDivider, { backgroundColor: theme.colors.surfaceMuted }]} />
          <SummaryRow label={t('common.subtotal')} value={formatMoney(order.subtotal)} theme={theme} />
          <SummaryRow label={t('common.delivery')} value={formatMoney(order.deliveryFee)} theme={theme} />
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>{t('common.total')}</Text>
            <Text style={[styles.totalValue, { color: theme.colors.text, fontFamily: theme.typography.title.fontFamily }]}>{formatMoney(order.total)}</Text>
          </View>
        </View>

        {/* Delivery address */}
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
            {t('orderDetail.deliveryAddress')}
          </Text>
          <Text style={[styles.infoRowPrimary, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
            {order.deliveryAddress.fullName}
          </Text>
          <Text style={[styles.infoRowSecondary, { color: theme.colors.textMuted }]}>
            {order.deliveryAddress.line1}, {order.deliveryAddress.postalCode} {order.deliveryAddress.city}
          </Text>
        </View>

        {/* Seller actions */}
        {isSellerOwner && availableSellerStatuses.length ? (
          <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text, fontFamily: theme.typography.heading.fontFamily }]}>
              {t('orderDetail.sellerActions')}
            </Text>
            <View style={styles.sellerActionsRow}>
              {availableSellerStatuses.map((status) => (
                <Pressable
                  key={status}
                  disabled={pendingStatus !== null}
                  onPress={() => {
                    setPendingStatus(status);
                    void advanceOrderStatus(order.id, status).finally(() => setPendingStatus(null));
                  }}
                  style={[styles.secondaryButton, { borderColor: theme.colors.text, opacity: pendingStatus ? theme.motion.disabledOpacity : 1 }]}>
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
                    {t('orderDetail.moveTo', { status: getOrderStatusLabel(status) })}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

function JourneyNode({
  icon,
  label,
  active,
  current,
  theme,
}: {
  icon: ComponentProps<typeof SymbolView>['name'];
  label: string;
  active: boolean;
  current: boolean;
  theme: AppTheme;
}) {
  return (
    <View style={styles.journeyNode}>
      <View
        style={[
          styles.journeyDot,
          {
            backgroundColor: current ? theme.colors.accent : active ? 'rgba(255,255,255,0.16)' : 'transparent',
            borderColor: active ? theme.colors.accent : 'rgba(255,255,255,0.32)',
          },
        ]}>
        <SymbolView tintColor={current ? theme.colors.onAccent : '#FFFFFF'} size={16} name={icon} />
      </View>
      <Text style={[styles.journeyLabel, { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)', fontFamily: theme.typography.micro.fontFamily }]}>
        {label}
      </Text>
    </View>
  );
}

function TimelineDot({ state, theme }: { state: 'complete' | 'current' | 'upcoming'; theme: AppTheme }) {
  if (state === 'complete') {
    return (
      <View style={[styles.timelineDot, { backgroundColor: theme.colors.text, borderColor: theme.colors.text }]}>
        <SymbolView tintColor="#FFFFFF" size={12} name={{ ios: 'checkmark', android: 'check', web: 'check' }} />
      </View>
    );
  }
  if (state === 'current') {
    return (
      <View style={[styles.timelineDot, { backgroundColor: theme.colors.accentTint, borderColor: theme.colors.accent }]}>
        <View style={[styles.timelineDotInner, { backgroundColor: theme.colors.accent }]} />
      </View>
    );
  }
  return <View style={[styles.timelineDot, { backgroundColor: theme.colors.surface, borderColor: theme.colors.borderStrong }]} />;
}

function SummaryRow({ label, value, theme }: { label: string; value: string; theme: AppTheme }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20 },
  notFoundTitle: { fontSize: 17, lineHeight: 24 },
  notFoundBody: { fontSize: 13, lineHeight: 18, textAlign: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  roundButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { gap: 1, flexShrink: 1 },
  headerTitle: { fontSize: 22, lineHeight: 28 },
  headerSubtitle: { fontSize: 13, lineHeight: 18 },

  journeyCard: { padding: 20 },
  journeyRow: { flexDirection: 'row', alignItems: 'center' },
  journeyNode: { alignItems: 'center', gap: 6, width: 68 },
  journeyDot: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  journeyLabel: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
  journeyLine: { flex: 1, height: 2, marginBottom: 22 },

  card: { borderWidth: 1, padding: 16, gap: 4 },
  etaLabel: { fontSize: 13, lineHeight: 18 },
  etaValue: { fontSize: 24, lineHeight: 30, marginTop: 2 },
  etaBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  etaBadgeText: { fontSize: 11, lineHeight: 14 },

  sectionTitle: { fontSize: 17, lineHeight: 24, marginBottom: 8 },
  timeline: { gap: 0 },
  timelineRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { width: 26, alignItems: 'center' },
  timelineDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  timelineDotInner: { width: 8, height: 8, borderRadius: 4 },
  timelineLine: { width: 2, flex: 1, minHeight: 20, marginVertical: 2 },
  timelineCopy: { flex: 1, paddingBottom: 16, gap: 2 },
  timelineLabel: { fontSize: 15, lineHeight: 20 },
  timelineDescription: { fontSize: 13, lineHeight: 18 },

  contactCard: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { fontSize: 15, lineHeight: 20 },
  contactCopy: { flex: 1, gap: 1 },
  contactButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  infoRowPrimary: { fontSize: 15, lineHeight: 20 },
  infoRowSecondary: { fontSize: 13, lineHeight: 18 },
  rowDivider: { height: 1, marginVertical: 8 },

  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { flex: 1, fontSize: 15, lineHeight: 20 },
  itemPrice: { fontSize: 15, lineHeight: 20 },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 14, lineHeight: 20 },
  summaryValue: { fontSize: 14, lineHeight: 20 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 },
  totalLabel: { fontSize: 17, lineHeight: 24 },
  totalValue: { fontSize: 22, lineHeight: 28 },

  sellerActionsRow: { gap: 10 },
  secondaryButton: { height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  secondaryButtonText: { fontSize: 15, lineHeight: 20 },
});
