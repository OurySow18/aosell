import { CourierRepository, SellerRepository } from '@aosell/core';
import { Link, usePathname } from 'expo-router';
import type { Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AdminLogo } from '@/components/admin-logo';
import { Icon } from '@/components/icon';
import type { IconName } from '@/components/icon';
import { useAppTheme } from '@/hooks/use-theme';
import { useAdminAuth } from '@/providers/admin-auth';

type NavItem = { href: Href; label: string; icon: IconName; badge?: number; disabled?: boolean };

export function AdminScreen({
  title,
  subtitle,
  headerRight,
  children,
}: {
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  const theme = useAppTheme();
  const { currentUser, signOut } = useAdminAuth();
  const pathname = usePathname();
  const [pendingSellers, setPendingSellers] = useState(0);
  const [pendingCouriers, setPendingCouriers] = useState(0);

  useEffect(() => {
    return SellerRepository.subscribeAll((sellers) =>
      setPendingSellers(sellers.filter((s) => s.verificationStatus === 'pending').length)
    );
  }, []);
  useEffect(() => {
    return CourierRepository.subscribeAll((couriers) =>
      setPendingCouriers(couriers.filter((c) => c.verificationStatus === 'pending').length)
    );
  }, []);

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: 'dashboard' },
    { href: '/orders', label: 'Commandes', icon: 'orders' },
    { href: '/sellers', label: 'Vendeurs', icon: 'sellers', badge: pendingSellers || undefined },
    { href: '/couriers', label: 'Livreurs', icon: 'couriers', badge: pendingCouriers || undefined },
    { href: '/moderation', label: 'Modération', icon: 'moderation', badge: 5 },
    { href: '/payments', label: 'Paiements', icon: 'payments', badge: 1 },
  ];

  const initials = (currentUser?.email ?? '??').slice(0, 2).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.sidebar, { backgroundColor: theme.colors.text }]}>
        <View style={styles.sidebarTop}>
          <AdminLogo onDark theme={theme} />
          <View style={styles.nav}>
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link asChild href={item.href} key={item.label}>
                  <Pressable
                    style={StyleSheet.flatten([
                      styles.navItem,
                      { borderRadius: theme.radii.md },
                      active && { backgroundColor: theme.colors.accent },
                    ])}>
                    <Icon color={active ? theme.colors.onAccent : '#C9CFDC'} name={item.icon} size={18} />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.navLabel,
                        {
                          color: active ? theme.colors.onAccent : '#C9CFDC',
                          fontFamily: active ? theme.typography.fontFamily.bodySemi : theme.typography.fontFamily.body,
                        },
                      ]}>
                      {item.label}
                    </Text>
                    {item.badge ? (
                      <View
                        style={[
                          styles.navBadge,
                          { borderRadius: theme.radii.pill, backgroundColor: active ? theme.colors.text : theme.colors.secondary },
                        ]}>
                        <Text style={[styles.navBadgeText, { color: active ? '#FFFFFF' : theme.colors.text }]}>{item.badge}</Text>
                      </View>
                    ) : null}
                  </Pressable>
                </Link>
              );
            })}
          </View>
        </View>

        <View style={styles.sidebarBottom}>
          <Text style={styles.villeLabel}>Ville</Text>
          <View style={styles.villePill}>
            <Text style={styles.villeText}>Bremen</Text>
          </View>
          <View style={styles.sidebarUser}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.accentTint }]}>
              <Text style={[styles.avatarText, { color: theme.colors.text }]}>{initials}</Text>
            </View>
            <View style={styles.userMeta}>
              <Text numberOfLines={1} style={styles.userName}>
                Équipe ops
              </Text>
              <Pressable onPress={() => void signOut()}>
                <Text style={styles.signOut}>Se déconnecter</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inner}>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={[theme.typography.title, { color: theme.colors.text }]}>{title}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, { color: theme.colors.textMuted, fontFamily: theme.typography.fontFamily.body }]}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            {headerRight}
          </View>
          {children}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', minHeight: '100%' },
  sidebar: {
    width: 248,
    justifyContent: 'space-between',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  sidebarTop: { gap: 28 },
  nav: { gap: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  navLabel: { fontSize: 14, lineHeight: 18, flex: 1 },
  navBadge: { minWidth: 20, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  navBadgeText: { fontSize: 11, fontWeight: '700' },
  sidebarBottom: { gap: 10, paddingHorizontal: 8 },
  villeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase', color: '#9AA3B8' },
  villePill: { backgroundColor: '#22304F', borderWidth: 1, borderColor: '#34436A', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 },
  villeText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  sidebarUser: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#2A3757' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700' },
  userMeta: { flex: 1, minWidth: 0 },
  userName: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  signOut: { color: '#C9CFDC', fontSize: 12 },
  content: { flexGrow: 1, padding: 32 },
  inner: { maxWidth: 1180, width: '100%', alignSelf: 'center', gap: 20 },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 16 },
  headerCopy: { gap: 4, flex: 1, minWidth: 220 },
  subtitle: { fontSize: 14, lineHeight: 19 },
});
