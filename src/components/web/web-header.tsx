import { router, usePathname } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { AosellLogo } from '@/components/brand/aosell-logo';
import { SegmentedControl } from '@/components/ui/segmented-control';
import type { Breakpoint } from '@/hooks/use-breakpoint';
import { useAppTheme, useThemeMode } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/i18n';
import { useAosell } from '@/providers/aosell-provider';

type AppTheme = ReturnType<typeof useAppTheme>;

const LANGUAGE_OPTIONS: { value: Locale; label: string }[] = [
  { value: 'fr', label: 'FR' },
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
];

const NAV_ITEMS = [
  { href: '/home', labelKey: 'webHeader.feed', match: ['/home'] },
  { href: '/search', labelKey: 'webHeader.restaurants', match: ['/search'] },
  { href: '/reels', labelKey: 'webHeader.reels', match: ['/reels'] },
  { href: '/orders', labelKey: 'webHeader.orders', match: ['/orders'] },
  { href: '/partner', labelKey: 'webHeader.becomePartner', match: ['/partner'] },
] as const;

export function WebHeader({ breakpoint }: { breakpoint: Breakpoint }) {
  const theme = useAppTheme();
  const { t, locale, setLocale } = useLocale();
  const { themeMode, setThemeMode } = useThemeMode();
  const { currentUser, cart } = useAosell();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const contentInset = Math.min(32, Math.max(16, width * 0.04));

  const cartCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  function isActive(matches: readonly string[]) {
    return matches.some((path) => pathname.startsWith(path));
  }

  function toggleTheme() {
    void setThemeMode(theme.dark ? 'light' : 'dark');
  }

  const nav = (
    <View style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.match);
        return (
          <Pressable key={item.href} onPress={() => router.push(item.href as never)} style={styles.navItem}>
            <Text
              style={[
                styles.navLabel,
                { color: active ? theme.colors.text : theme.colors.textMuted, fontFamily: theme.typography.label.fontFamily },
              ]}>
              {t(item.labelKey)}
            </Text>
            {active ? <View style={[styles.navUnderline, { backgroundColor: theme.colors.accent }]} /> : null}
          </Pressable>
        );
      })}
    </View>
  );

  const languageSwitcher = (
    <View style={styles.languagePill}>
      <SegmentedControl options={LANGUAGE_OPTIONS} value={locale} onChange={(next) => void setLocale(next)} />
    </View>
  );

  const themeButton = (
    <Pressable
      accessibilityLabel={t('webHeader.toggleTheme')}
      onPress={toggleTheme}
      style={[styles.iconButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
      <SymbolView
        tintColor={theme.colors.text}
        size={19}
        name={theme.dark ? { ios: 'sun.max', android: 'light_mode', web: 'light_mode' } : { ios: 'moon', android: 'dark_mode', web: 'dark_mode' }}
      />
    </Pressable>
  );

  const cartButton = (
    <Pressable
      accessibilityLabel={t('webHeader.cart')}
      onPress={() => router.push('/cart')}
      style={[styles.iconButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.text }]}>
      <SymbolView tintColor={theme.colors.text} size={19} name={{ ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' }} />
      {cartCount > 0 ? (
        <View style={[styles.cartBadge, { backgroundColor: theme.colors.secondary, borderColor: theme.colors.surface }]}>
          <Text style={[styles.cartBadgeText, { color: theme.colors.onSecondary }]}>{cartCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );

  const accountLink = (
    <Pressable onPress={() => router.push(currentUser ? '/profile' : '/welcome')} style={styles.accountLink}>
      <Text style={[styles.accountLinkText, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
        {currentUser ? t('tabs.profile') : t('webHeader.signIn')}
      </Text>
    </Pressable>
  );

  if (breakpoint === 'desktop') {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <View style={[styles.desktopRow, { paddingHorizontal: contentInset }]}>
          <Pressable onPress={() => router.push('/home')} style={styles.logoLink}>
            <AosellLogo compact />
          </Pressable>
          {nav}
          <View style={styles.desktopActions}>
            {languageSwitcher}
            {themeButton}
            {cartButton}
            {accountLink}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
      <View style={[styles.tabletRowTop, { paddingHorizontal: contentInset }]}>
        <Pressable onPress={() => router.push('/home')} style={styles.logoLink}>
          <AosellLogo compact />
        </Pressable>
        <View style={styles.tabletActions}>
          {themeButton}
          {cartButton}
          {accountLink}
        </View>
      </View>
      <View style={[styles.tabletRowBottom, { paddingHorizontal: contentInset, borderTopColor: theme.colors.border }]}>
        {nav}
        {languageSwitcher}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderBottomWidth: 1, width: '100%' },
  desktopRow: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  logoLink: { marginRight: 8 },
  nav: { flexDirection: 'row', alignItems: 'center', gap: 24, flex: 1 },
  navItem: { paddingVertical: 24, alignItems: 'center' },
  navLabel: { fontSize: 15, lineHeight: 20 },
  navUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 },
  desktopActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  languagePill: { width: 148 },
  iconButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  accountLink: { paddingHorizontal: 4, minHeight: 40, justifyContent: 'center' },
  accountLinkText: { fontSize: 15, lineHeight: 20 },

  tabletRowTop: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tabletActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tabletRowBottom: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    gap: 16,
  },
});
