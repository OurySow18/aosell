import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/icon';
import type { IconName } from '@/components/icon';
import type { AppTheme } from '@/hooks/use-theme';

type Tab = { href: Href; label: string; icon: IconName; disabled?: boolean };

const TABS: Tab[] = [
  { href: '/', label: 'Courses', icon: 'pin' },
  { href: '/gains', label: 'Gains', icon: 'chart' },
  { href: '/', label: 'Créneaux', icon: 'calendar', disabled: true },
  { href: '/', label: 'Profil', icon: 'person', disabled: true },
];

export function BottomNav({ active, theme }: { active: 'courses' | 'gains'; theme: AppTheme }) {
  return (
    <View style={[styles.root, { borderTopColor: theme.colors.border }]}>
      {TABS.map((tab, index) => {
        const isActive = (index === 0 && active === 'courses') || (index === 1 && active === 'gains');
        const content = (
          <View style={styles.item}>
            <View style={[styles.iconWrap, isActive && { backgroundColor: theme.colors.accent, borderRadius: 999 }]}>
              <Icon color={isActive ? theme.colors.onAccent : theme.colors.textMuted} name={tab.icon} size={isActive ? 18 : 20} />
            </View>
            <Text style={[styles.label, { color: isActive ? theme.colors.text : theme.colors.textMuted, fontWeight: isActive ? '700' : '600' }]}>
              {tab.label}
            </Text>
          </View>
        );

        if (tab.disabled) {
          return (
            <View key={tab.label} style={styles.disabled}>
              {content}
            </View>
          );
        }

        return (
          <Link asChild href={tab.href} key={tab.label}>
            <Pressable>{content}</Pressable>
          </Link>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', borderTopWidth: 1, paddingTop: 6, paddingBottom: 14, paddingHorizontal: 8, backgroundColor: '#FFFFFF' },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 4 },
  disabled: { flex: 1, opacity: 0.4 },
  iconWrap: { width: 44, height: 28, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11 },
});
