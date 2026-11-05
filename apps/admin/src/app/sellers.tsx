import { SellerRepository } from '@aosell/core';
import type { SellerProfile } from '@aosell/core';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AdminScreen } from '@/components/admin-screen';
import { useAdminAuth } from '@/providers/admin-auth';

export default function SellersScreen() {
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
      {sellers.map((seller) => (
        <View key={seller.id} style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{seller.brandName}</Text>
            <Text style={styles.meta}>
              {seller.city}, {seller.countryCode} · {seller.type} · {seller.verificationStatus}
            </Text>
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'verified')}
              style={[styles.button, styles.approve]}>
              <Text style={styles.buttonText}>Approuver</Text>
            </Pressable>
            <Pressable
              onPress={() => void SellerRepository.setVerificationStatus(seller.id, 'rejected')}
              style={[styles.button, styles.reject]}>
              <Text style={styles.buttonText}>Rejeter</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  meta: { fontSize: 13, color: '#666666' },
  actions: { flexDirection: 'row', gap: 8 },
  button: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approve: { backgroundColor: '#1B8A3A' },
  reject: { backgroundColor: '#B00020' },
  buttonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
