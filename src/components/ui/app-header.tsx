import { router, useSegments } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';

type AppTheme = ReturnType<typeof useAppTheme>;
type SymbolName = ComponentProps<typeof SymbolView>['name'];

export function AppHeader() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const segments = useSegments();
  const isTabScreen = segments[0] === '(tabs)';
  const showBack = !isTabScreen && router.canGoBack();

  return (
    <View style={styles.header}>
      {showBack ? (
        <HeaderAction
          theme={theme}
          accessibilityLabel={t('common.back')}
          backgroundColor={theme.colors.surfaceMuted}
          borderColor={theme.colors.border}
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          iconColor={theme.colors.text}
          onPress={() => router.back()}
        />
      ) : null}

      <Pressable
        accessibilityLabel={t('common.search')}
        accessibilityRole="search"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [
          styles.searchBar,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.lg },
          theme.shadows.sm,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.searchIcon, { backgroundColor: theme.colors.accentTint, borderRadius: theme.radii.md }]}>
          <SymbolView tintColor={theme.colors.accent} size={20} name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} />
        </View>
        <Text
          numberOfLines={1}
          style={[styles.searchLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>
          {t('common.search')}
        </Text>
      </Pressable>

      {!showBack ? (
        <HeaderAction
          theme={theme}
          accessibilityLabel={t('common.notifications')}
          backgroundColor={theme.colors.surface}
          borderColor={theme.colors.border}
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          iconColor={theme.colors.text}
          onPress={() => router.push('/notifications')}
        />
      ) : null}

      <HeaderAction
        theme={theme}
        accessibilityLabel={t('cart.eyebrow')}
        backgroundColor={theme.colors.text}
        borderColor={theme.colors.text}
        icon={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }}
        iconColor={theme.colors.accent}
        onPress={() => router.push('/cart')}
      />
    </View>
  );
}

function HeaderAction({
  accessibilityLabel,
  backgroundColor,
  borderColor,
  icon,
  iconColor,
  onPress,
  theme,
}: {
  accessibilityLabel: string;
  backgroundColor: string;
  borderColor: string;
  icon: SymbolName;
  iconColor: string;
  onPress: () => void;
  theme: AppTheme;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor, borderColor, borderRadius: theme.radii.md },
        pressed && styles.pressed,
      ]}>
      <SymbolView tintColor={iconColor} size={19} name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 6 },
  searchBar: { minWidth: 0, minHeight: 56, flex: 1, borderWidth: 1, padding: 6, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  searchLabel: { minWidth: 0, flex: 1, fontSize: 15, lineHeight: 20 },
  action: { width: 40, height: 56, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
});
