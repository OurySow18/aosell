import { COURIER_COMMISSION_RATE, OrderRepository, palette } from '@aosell/core';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { MapBackdrop } from '@/components/map-backdrop';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierOrders } from '@/providers/courier-orders';

export default function DeliveryScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const { activeOrder } = useCourierOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!activeOrder) {
    return <Redirect href="/" />;
  }
  if (activeOrder.status === 'preparing') {
    return <Redirect href="/pickup" />;
  }

  const address = activeOrder.deliveryAddress;

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await OrderRepository.advanceStatus(activeOrder!, 'delivered');
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <MapBackdrop height={230}>
        <View style={[styles.pin, styles.pinSelf, { backgroundColor: palette.ink }]} />
        <View style={[styles.pin, styles.pinDropoff, { backgroundColor: theme.colors.secondary }]} />
      </MapBackdrop>

      <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sheet }]}>
        <View style={styles.topRow}>
          <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>{t('delivery.step')}</Text>
          <Text style={[styles.orderId, { color: theme.colors.textMuted }]}>#{activeOrder.id.slice(0, 8).toUpperCase()}</Text>
        </View>

        <View style={{ gap: 2 }}>
          <Text style={[styles.clientName, { color: theme.colors.text }]}>{address.fullName}</Text>
          <Text style={[styles.addressLine, { color: theme.colors.text }]}>
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
          </Text>
          <Text style={[styles.addressMeta, { color: theme.colors.textMuted }]}>
            {address.postalCode} {address.city}
          </Text>
        </View>

        {address.instructions ? (
          <View style={[styles.noteBox, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
            <Text style={[styles.noteText, { color: theme.colors.text }]}>
              <Text style={styles.noteStrong}>{t('delivery.clientNote')}</Text>
              {address.instructions}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => void Linking.openURL(`tel:${address.phoneNumber}`)}
            style={[styles.actionButton, { backgroundColor: palette.ink, borderRadius: theme.radii.lg }]}>
            <Text style={styles.actionButtonTextDark}>{t('delivery.call')}</Text>
          </Pressable>
          <View style={[styles.actionButton, styles.actionButtonOutline, { borderColor: theme.colors.border, borderRadius: theme.radii.lg }]}>
            <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>{address.phoneNumber}</Text>
          </View>
        </View>

        <View style={styles.bottomArea}>
          <Pressable
            disabled={isSubmitting}
            onPress={() => void handleConfirm()}
            style={[styles.confirmButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.confirmButtonText, { color: theme.colors.onAccent }]}>
              {t('delivery.confirm', { amount: `+${((activeOrder.total.amountCents * COURIER_COMMISSION_RATE) / 100).toFixed(2)} €` })}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pin: { position: 'absolute', width: 26, height: 26, borderRadius: 13, borderWidth: 4, borderColor: '#FFFFFF' },
  pinSelf: { left: 110, top: 150 },
  pinDropoff: { left: 230, top: 60 },
  sheet: { marginTop: -24, flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  orderId: { marginLeft: 'auto', fontSize: 13 },
  clientName: { fontFamily: 'Poppins_700Bold', fontSize: 20 },
  addressLine: { fontSize: 15 },
  addressMeta: { fontSize: 13 },
  noteBox: { padding: 14 },
  noteText: { fontSize: 13, lineHeight: 19 },
  noteStrong: { fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  actionButtonOutline: { borderWidth: 2 },
  actionButtonText: { fontWeight: '700' },
  actionButtonTextDark: { color: '#FFFFFF', fontWeight: '700' },
  bottomArea: { marginTop: 'auto' },
  confirmButton: { height: 56, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontSize: 15, fontWeight: '700' },
});
