import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import type { Locale } from '@/lib/i18n';
import { ThemedText } from '@/components/themed-text';

const options: Array<{ locale: Locale; label: string }> = [
  { locale: 'en', label: 'EN' },
  { locale: 'fr', label: 'FR' },
  { locale: 'de', label: 'DE' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const theme = useTheme();
  const { locale, setLocale, t } = useLocale();

  return (
    <View style={styles.container}>
      {!compact ? (
        <ThemedText type="label" themeColor="textSecondary">
          {t('common.language')}
        </ThemedText>
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
                  backgroundColor: active ? theme.earth : theme.backgroundElement,
                  borderColor: active ? theme.earth : theme.border,
                  minWidth: compact ? 54 : 68,
                },
              ]}>
              <ThemedText type="button" style={{ color: active ? theme.background : theme.text }}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  option: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
