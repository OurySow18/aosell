import { OrderRepository, SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { useAppTheme } from '@/hooks/use-theme';
import { useCourierOrders } from '@/providers/courier-orders';

export default function PickupScreen() {
  const theme = useAppTheme();
  const { activeOrder } = useCourierOrders();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    return SellerRepository.subscribeAll(setSellers);
  }, []);

  if (!activeOrder) {
    return <Redirect href="/" />;
  }
  if (activeOrder.status === 'out_for_delivery') {
    return <Redirect href="/delivery" />;
  }

  const seller = sellers.find((s) => s.id === activeOrder.sellerId);
  const allChecked = activeOrder.items.every((_, index) => checked[index]);

  async function handleConfirm() {
    setIsSubmitting(true);
    try {
      await OrderRepository.advanceStatus(activeOrder!, 'out_for_delivery');
      router.replace('/delivery');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <SafeAreaView edges={['top']} style={[styles.header, { backgroundColor: theme.colors.text }]}>
        <View style={styles.headerTop}>
          <Text style={[styles.kicker, { color: theme.colors.accent }]}>Étape 1 sur 2 · Retrait</Text>
          <Text style={styles.orderId}>#{activeOrder.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <Text style={styles.sellerName}>{seller?.brandName ?? 'Vendeur'}</Text>
        <Text style={styles.sellerAddress}>
          {seller ? `${seller.city}, ${seller.countryCode}` : ''}
        </Text>
        {seller?.phoneNumber ? (
          <View style={styles.headerActions}>
            <View style={[styles.callButton, { backgroundColor: '#22304F' }]}>
              <Icon color="#FFFFFF" name="phone" size={16} />
              <Text style={styles.callButtonText}>{seller.phoneNumber}</Text>
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      <View style={styles.body}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vérifie la commande</Text>
        {activeOrder.items.map((item, index) => {
          const on = !!checked[index];
          return (
            <Pressable
              key={item.id}
              onPress={() => setChecked((prev) => ({ ...prev, [index]: !on }))}
              style={[
                styles.itemRow,
                { borderRadius: theme.radii.lg },
                on ? { borderColor: theme.colors.accent, backgroundColor: theme.colors.surface } : { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}>
              <View style={[styles.checkbox, { borderRadius: theme.radii.sm }, on ? { backgroundColor: theme.colors.accent } : { borderWidth: 2, borderColor: theme.colors.borderStrong }]}>
                {on ? <Icon color={theme.colors.onAccent} name="check" size={14} /> : null}
              </View>
              <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                {item.quantity}× {item.titleSnapshot}
              </Text>
            </Pressable>
          );
        })}

        <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
          Un article manque ou le sac n'est pas fermé ? Préviens le vendeur avant de partir.
        </Text>

        <View style={styles.bottomArea}>
          {allChecked ? (
            <Pressable
              disabled={isSubmitting}
              onPress={() => void handleConfirm()}
              style={[styles.confirmButton, { backgroundColor: theme.colors.accent, borderRadius: theme.radii.xl }]}>
              <Text style={[styles.confirmButtonText, { color: theme.colors.onAccent }]}>J'ai récupéré la commande</Text>
            </Pressable>
          ) : (
            <View style={[styles.confirmButton, styles.confirmButtonDisabled, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.xl }]}>
              <Text style={[styles.confirmButtonText, { color: theme.colors.textMuted }]}>
                {activeOrder.items.length - Object.values(checked).filter(Boolean).length === 1
                  ? 'Coche le dernier élément'
                  : `Coche les ${activeOrder.items.length - Object.values(checked).filter(Boolean).length} éléments restants`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 22, gap: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  orderId: { marginLeft: 'auto', color: '#C9CFDC', fontSize: 13 },
  sellerName: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 22 },
  sellerAddress: { color: '#C9CFDC' },
  headerActions: { flexDirection: 'row', gap: 8 },
  callButton: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14 },
  callButtonText: { color: '#FFFFFF', fontWeight: '700' },

  body: { flex: 1, padding: 20, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 14, borderWidth: 2 },
  checkbox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontSize: 15, fontWeight: '600', flex: 1 },
  helperText: { fontSize: 13, lineHeight: 19 },
  bottomArea: { marginTop: 'auto' },
  confirmButton: { height: 56, alignItems: 'center', justifyContent: 'center' },
  confirmButtonDisabled: {},
  confirmButtonText: { fontSize: 16, fontWeight: '700' },
});
