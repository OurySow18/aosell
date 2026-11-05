import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAdminAuth } from '@/providers/admin-auth';

// Deliberately plain — this app is an internal tool to make the order
// lifecycle testable end-to-end, not a designed product surface.
export function AdminScreen({ title, children }: { title: string; children: React.ReactNode }) {
  const { signOut } = useAdminAuth();

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <View style={styles.nav}>
          <Link href="/sellers" style={styles.navLink}>
            Vendeurs
          </Link>
          <Link href="/couriers" style={styles.navLink}>
            Livreurs
          </Link>
          <Link href="/orders" style={styles.navLink}>
            Commandes
          </Link>
        </View>
        <Pressable onPress={() => void signOut()}>
          <Text style={styles.signOut}>Se déconnecter</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E2E2',
  },
  nav: { flexDirection: 'row', gap: 16 },
  navLink: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  signOut: { fontSize: 13, color: '#B00020' },
  content: { padding: 16, gap: 12, maxWidth: 900, width: '100%', alignSelf: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
});
