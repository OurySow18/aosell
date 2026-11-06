import { COURIER_COMMISSION_RATE, OrderRepository, SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapBackdrop } from '@/components/map-backdrop';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';
import { useCourierOrders } from '@/providers/courier-orders';

export default function OfferScreen() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const { offeredOrder } = useCourierOrders();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    return SellerRepository.subscribeAll(setSellers);
  }, []);

  if (!offeredOrder) {
    return <Redirect href="/" />;
  }

  const seller = sellers.find((s) => s.id === offeredOrder.sellerId);
  const estimatedGainCents = Math.round(offeredOrder.total.amountCents * COURIER_COMMISSION_RATE);

  async function handleAccept() {
    setIsResponding(true);
    try {
      await OrderRepository.respondToAssignment(offeredOrder!, true);
      router.replace('/pickup');
    } finally {
      setIsResponding(false);
    }
  }

  async function handleDecline() {
    setIsResponding(true);
    try {
      await OrderRepository.respondToAssignment(offeredOrder!, false);
      router.replace('/');
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <MapBackdrop height={300}>
        <View style={[styles.pin, styles.pinPickup, { backgroundColor: theme.colors.accent }]} />
        <View style={[styles.pin, styles.pinDropoff, { backgroundColor: theme.colors.secondary }]} />
      </MapBackdrop>

      <View style={[styles.sheet, { backgroundColor: theme.colors.surface, borderRadius: theme.radii.sheet }]}>
        <View style={styles.topRow}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.kicker, { color: theme.colors.textMuted }]}>{t('offer.title')}</Text>
            <Text style={[styles.amount, { color: theme.colors.text }]}>≈ {(estimatedGainCents / 100).toFixed(2)} €</Text>
            <Text style={[styles.estimateNote, { color: theme.colors.textMuted }]}>{t('offer.estimateNote')}</Text>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <Text style={[styles.badge, { backgroundColor: theme.colors.surfaceMuted, color: theme.colors.text }]}>
            {t('offer.orderAmount', { amount: `${(offeredOrder.total.amountCents / 100).toFixed(2)} €` })}
          </Text>
        </View>

        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepMarkerCol}>
              <View style={[styles.stepDot, { backgroundColor: theme.colors.accent }]} />
              <View style={[styles.stepLine, { backgroundColor: theme.colors.border }]} />
            </View>
            <View style={{ flex: 1, gap: 2, paddingBottom: 16 }}>
              <Text style={[styles.stepLabel, { color: theme.colors.textMuted }]}>{t('offer.pickup')}</Text>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{seller?.brandName ?? t('offer.sellerFallback')}</Text>
              <Text style={[styles.stepMeta, { color: theme.colors.textMuted }]}>
                {seller ? `${seller.city}, ${seller.countryCode}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.step}>
            <View style={styles.stepMarkerCol}>
              <View style={[styles.stepDot, { backgroundColor: theme.colors.secondary }]} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.stepLabel, { color: theme.colors.textMuted }]}>{t('offer.dropoff')}</Text>
              <Text style={[styles.stepTitle, { color: theme.colors.text }]}>{offeredOrder.deliveryAddress.city}</Text>
              <Text style={[styles.stepMeta, { color: theme.colors.textMuted }]}>{t('offer.addressHidden')}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.actions, { paddingBottom: insets.bottom }]}>
          <Pressable
            disabled={isResponding}
            onPress={() => void handleDecline()}
            style={[styles.secondaryButton, { borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.secondaryButtonText, { color: theme.colors.text }]}>{t('offer.decline')}</Text>
          </Pressable>
          <Pressable
            disabled={isResponding}
            onPress={() => void handleAccept()}
            style={[styles.primaryButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.xl }]}>
            <Text style={[styles.primaryButtonText, { color: theme.colors.onAccent }]}>{t('offer.accept')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  pin: { position: 'absolute', width: 28, height: 28, borderRadius: 14, borderWidth: 4, borderColor: '#FFFFFF' },
  pinPickup: { left: 90, top: 160 },
  pinDropoff: { left: 250, top: 60 },
  sheet: { marginTop: -24, flex: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 28, gap: 18 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  kicker: { fontSize: 13, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  amount: { fontFamily: 'Poppins_700Bold', fontSize: 36, lineHeight: 40 },
  estimateNote: { fontSize: 13 },
  badgeRow: { flexDirection: 'row', gap: 8 },
  badge: { fontSize: 13, fontWeight: '600', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, overflow: 'hidden' },
  steps: { gap: 0 },
  step: { flexDirection: 'row', gap: 14 },
  stepMarkerCol: { width: 16, alignItems: 'center' },
  stepDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  stepLine: { flex: 1, width: 2, minHeight: 26 },
  stepLabel: { fontSize: 12 },
  stepTitle: { fontWeight: '700', fontSize: 16 },
  stepMeta: { fontSize: 13 },
  actions: { marginTop: 'auto', flexDirection: 'row', gap: 10 },
  secondaryButton: { flex: 1, height: 56, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontWeight: '700', fontSize: 16 },
  primaryButton: { flex: 2, height: 56, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontWeight: '700', fontSize: 16 },
});
