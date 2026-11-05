import { CourierRepository } from '@aosell/core';
import type { CourierProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { StatusPill, toneForVerificationStatus } from '@/components/status-pill';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';

export default function CouriersScreen() {
  const theme = useAppTheme();
  const { status } = useAdminAuth();
  const [couriers, setCouriers] = useState<CourierProfile[]>([]);

  useEffect(() => {
    if (status !== 'admin') {
      return;
    }
    return CourierRepository.subscribeAll(setCouriers);
  }, [status]);

  if (status !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <AdminScreen title={`Livreurs (${couriers.length})`}>
      <View style={[styles.list, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl }]}>
        {couriers.map((courier, index) => (
          <View
            key={courier.id}
            style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
            <View style={styles.info}>
              <Text style={[styles.name, { color: theme.colors.text, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                {courier.displayName}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
                {courier.city}, {courier.countryCode} · {courier.phoneNumber} · {courier.availability}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
                Dû (15% par course) : {((courier.totalEarnedCents ?? 0) / 100).toFixed(2)} €
              </Text>
            </View>
            <StatusPill label={courier.verificationStatus} theme={theme} tone={toneForVerificationStatus(courier.verificationStatus)} />
            <View style={styles.actions}>
              <Pressable
                onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'verified')}
                style={[styles.actionButton, { backgroundColor: theme.colors.successTint, borderRadius: theme.radii.md }]}>
                <Text style={[styles.actionText, { color: theme.colors.success, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                  Approuver
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void CourierRepository.setVerificationStatus(courier.id, 'rejected')}
                style={[styles.actionButton, { backgroundColor: theme.colors.errorTint, borderRadius: theme.radii.md }]}>
                <Text style={[styles.actionText, { color: theme.colors.error, fontFamily: theme.typography.fontFamily.bodySemi }]}>
                  Rejeter
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
        {!couriers.length ? (
          <Text style={[styles.empty, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
            Aucun livreur pour l'instant.
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
