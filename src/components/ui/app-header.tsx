import { router, useSegments } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export function AppHeader() {
  const theme = useTheme();
  const { t } = useLocale();
  const segments = useSegments();
  const isTabScreen = segments[0] === '(tabs)';
  const showBack = !isTabScreen && router.canGoBack();

  return (
    <View style={styles.header}>
      {showBack ? (
        <HeaderAction
          accessibilityLabel={t('common.back')}
          backgroundColor={theme.backgroundSelected}
          borderColor={theme.border}
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          iconColor={theme.earth}
          onPress={() => router.back()}
        />
      ) : null}

      <Pressable
        accessibilityLabel={t('common.search')}
        accessibilityRole="search"
        onPress={() => router.push('/search')}
        style={({ pressed }) => [
          styles.searchBar,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          Shadows.card,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.searchIcon, { backgroundColor: theme.backgroundSelected }]}>
          <SymbolView
            tintColor={theme.burntOrange}
            size={20}
            name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
          />
        </View>
        <ThemedText type="button" numberOfLines={1} style={styles.searchLabel}>
          {t('common.search')}
        </ThemedText>
      </Pressable>

      {!showBack ? (
        <HeaderAction
          accessibilityLabel={t('common.notifications')}
          backgroundColor={theme.backgroundElement}
          borderColor={theme.border}
          icon={{ ios: 'bell.fill', android: 'notifications', web: 'notifications' }}
          iconColor={theme.earth}
          onPress={() => router.push('/notifications')}
        />
      ) : null}

      <HeaderAction
        accessibilityLabel={t('cart.eyebrow')}
        backgroundColor={theme.earth}
        borderColor={theme.earth}
        icon={{ ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' }}
        iconColor={theme.accent}
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
}: {
  accessibilityLabel: string;
  backgroundColor: string;
  borderColor: string;
  icon: SymbolName;
  iconColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { backgroundColor, borderColor },
        pressed && styles.pressed,
      ]}>
      <SymbolView tintColor={iconColor} size={19} name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchBar: {
    minWidth: 0,
    minHeight: 60,
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  searchIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchLabel: {
    minWidth: 0,
    flex: 1,
  },
  action: {
    width: 42,
    height: 60,
    borderRadius: Radius.medium,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
