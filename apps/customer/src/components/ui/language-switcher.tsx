import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/i18n';

const options: Array<{ locale: Locale; label: string }> = [
  { locale: 'en', label: 'EN' },
  { locale: 'fr', label: 'FR' },
  { locale: 'de', label: 'DE' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const theme = useAppTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.container}>
      {!compact ? (
        <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>
          {t('common.language')}
        </Text>
      ) : null}
      <View style={styles.row}>
        {options.map((option) => {
          const active = option.locale === locale;

          return (
            <Pressable
              key={option.locale}
              onPress={() => {
                void setLocale(option.locale);
              }}
              style={[
                styles.option,
                {
                  borderRadius: theme.radii.pill,
                  backgroundColor: active ? theme.colors.text : theme.colors.surface,
                  borderColor: active ? theme.colors.text : theme.colors.border,
                  minWidth: compact ? 54 : 68,
                },
              ]}>
              <Text
                style={[
                  styles.optionText,
                  { color: active ? theme.colors.background : theme.colors.text, fontFamily: theme.typography.label.fontFamily },
                ]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  option: { minHeight: 40, paddingHorizontal: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  optionText: { fontSize: 15, lineHeight: 20 },
});
