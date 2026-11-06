import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import type { IconName } from '@/components/icon';
import type { AppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';

type ActiveTab = 'courses' | 'gains' | 'slots' | 'profile';
type Tab = { key: ActiveTab; href: Href; label: string; icon: IconName };

export function BottomNav({ active, theme }: { active: ActiveTab; theme: AppTheme }) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const TABS: Tab[] = [
    { key: 'courses', href: '/', label: t('nav.courses'), icon: 'pin' },
    { key: 'gains', href: '/gains', label: t('nav.gains'), icon: 'chart' },
    { key: 'slots', href: '/slots', label: t('nav.slots'), icon: 'calendar' },
    { key: 'profile', href: '/profile', label: t('nav.profile'), icon: 'person' },
  ];

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.tabBar, borderTopColor: theme.colors.border, paddingBottom: 8 + insets.bottom },
      ]}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;

        return (
          <Link asChild href={tab.href} key={tab.key}>
            <Pressable style={styles.item}>
              <View style={[styles.iconWrap, isActive && { backgroundColor: theme.colors.accent, borderRadius: 999 }]}>
                <Icon color={isActive ? theme.colors.onAccent : theme.colors.textMuted} name={tab.icon} size={isActive ? 18 : 20} />
              </View>
              <Text style={[styles.label, { color: isActive ? theme.colors.text : theme.colors.textMuted, fontWeight: isActive ? '700' : '600' }]}>
                {tab.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6, paddingHorizontal: 8 },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  iconWrap: { width: 44, height: 28, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
});
