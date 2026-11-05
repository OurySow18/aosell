import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useLocale } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';
import type { AppTheme } from '@/hooks/use-theme';

const LOCALES: Locale[] = ['fr', 'en', 'de'];

export function LanguageSwitcher({ theme, onDark = false }: { theme: AppTheme; onDark?: boolean }) {
  const { locale, setLocale } = useLocale();

  return (
    <View style={styles.row}>
      {LOCALES.map((item) => {
        const active = item === locale;
        return (
          <Pressable key={item} onPress={() => void setLocale(item)} style={styles.item}>
            <Text
              style={[
                styles.label,
                onDark
                  ? { color: active ? '#FFFFFF' : '#9AA3B8', fontWeight: active ? '700' : '600' }
                  : { color: active ? theme.colors.text : theme.colors.textMuted, fontWeight: active ? '700' : '600' },
              ]}>
              {item.toUpperCase()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  item: { paddingVertical: 2, paddingHorizontal: 2 },
  label: { fontSize: 12 },
});
