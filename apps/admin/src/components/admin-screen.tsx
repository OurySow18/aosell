import { Link, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminLogo } from '@/components/admin-logo';
import { useAdminAuth } from '@/providers/admin-auth';
import { useAppTheme } from '@/hooks/use-theme';

const NAV_ITEMS: { href: Href; label: string }[] = [
  { href: '/orders', label: 'Commandes' },
  { href: '/sellers', label: 'Vendeurs' },
  { href: '/couriers', label: 'Livreurs' },
];

export function AdminScreen({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useAppTheme();
  const { currentUser, signOut } = useAdminAuth();
  const pathname = usePathname();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.sidebar, { backgroundColor: theme.colors.surface, borderRightColor: theme.colors.border }]}>
        <View style={styles.sidebarTop}>
          <AdminLogo theme={theme} />
          <View style={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link asChild href={item.href} key={item.label}>
                  <Pressable
                    style={[
                      styles.navItem,
                      { borderRadius: theme.radii.md },
                      active && { backgroundColor: theme.colors.accentTint },
                    ]}>
                    <Text
                      style={[
                        styles.navLabel,
                        {
                          color: active ? theme.colors.text : theme.colors.textMuted,
                          fontFamily: active ? theme.typography.fontFamily.bodySemi : theme.typography.fontFamily.body,
                        },
                      ]}>
                      {item.label}
                    </Text>
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>

        <View style={[styles.sidebarBottom, { borderTopColor: theme.colors.border }]}>
          <Text numberOfLines={1} style={[styles.email, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
            {currentUser?.email}
          </Text>
          <Pressable onPress={() => void signOut()}>
            <Text style={[styles.signOut, { color: theme.colors.secondaryText, fontFamily: theme.typography.fontFamily.bodySemi }]}>
              Se déconnecter
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <Text style={[styles.title, theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  sidebar: {
    width: 240,
    borderRightWidth: 1,
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  sidebarTop: { gap: 32 },
  nav: { gap: 4 },
  navItem: { paddingHorizontal: 12, paddingVertical: 10 },
  navLabel: { fontSize: 14, lineHeight: 18 },
  sidebarBottom: { borderTopWidth: 1, paddingTop: 14, gap: 8 },
  email: { fontSize: 12, lineHeight: 16 },
  signOut: { fontSize: 13, lineHeight: 17 },
  content: { flexGrow: 1, padding: 32 },
  inner: { maxWidth: 820, width: '100%', alignSelf: 'center', gap: 20 },
  title: { marginBottom: 4 },
});
