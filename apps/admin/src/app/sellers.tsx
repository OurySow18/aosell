import { SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StatusPill, toneForVerificationStatus } from '@/components/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';

export default function SellersScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [sellers, setSellers] = useState<SellerProfile[]>([]);

  useEffect(() => {
    if (status !== 'admin') {
      return;
    }
    return SellerRepository.subscribeAll(setSellers);
  }, [status]);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <AdminScreen title={`Vendeurs (${sellers.length})`}>
      <View style={[styles.list, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        {sellers.map((seller, index) => (
          <View
            key={seller.id}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                {seller.brandName}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
                {seller.city}, {seller.countryCode} · {seller.type}
              </Text>
            </View>
            <StatusPill label={seller.verificationStatus} theme={theme} tone={toneForVerificationStatus(seller.verificationStatus)} />
            <View style={styles.actions}>
              <Pressable
                onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'verified')}
                style={[styles.actionButton, { backgroundColor: theme.colors.successTint, borderRadius: theme.radii.md }]}>
                <Text style={[styles.actionText, { color: theme.colors.success, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                  Approuver
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'rejected')}
                style={[styles.actionButton, { backgroundColor: theme.colors.errorTint, borderRadius: theme.radii.md }]}>
                <Text style={[styles.actionText, { color: theme.colors.error, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                  Rejeter
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {!sellers.length ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
            Aucun vendeur pour l'instant.
          </Text>
        ) : null}
      </View>
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  list: { borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 18, paddingVertical: 14 },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 17 },
  actions: { flexDirection: 'row', gap: 8 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 7 },
  actionText: { fontSize: 13, lineHeight: 16 },
  empty: { padding: 20, fontSize: 14, textAlign: 'center' },
});
