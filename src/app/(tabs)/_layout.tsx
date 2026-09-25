import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';

const TAB_CONTENT_HEIGHT = 56;
const ICON_ZONE = { width: 56, height: 30 };

export default function TabsLayout() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          height: TAB_CONTENT_HEIGHT + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
          paddingHorizontal: 6,
        },
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.home')}
              icon={{ ios: 'house', android: 'home', web: 'home' }}
              iconActive={{ ios: 'house.fill', android: 'home', web: 'home' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.search')}
              icon={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.feed')}
              icon={{ ios: 'play.rectangle.on.rectangle', android: 'dynamic_feed', web: 'dynamic_feed' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.orders')}
              icon={{ ios: 'shippingbox', android: 'inbox', web: 'inbox' }}
              iconActive={{ ios: 'shippingbox.fill', android: 'inbox', web: 'inbox' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.profile')}
              icon={{ ios: 'person', android: 'person', web: 'person' }}
              iconActive={{ ios: 'person.fill', android: 'person', web: 'person' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen name="add" options={{ href: null }} />
    </Tabs>
  );
}

type SymbolName = React.ComponentProps<typeof SymbolView>['name'];

function TabIcon({
  focused,
  label,
  icon,
  iconActive,
  theme,
}: {
  focused: boolean;
  label: string;
  icon: SymbolName;
  iconActive?: SymbolName;
  theme: ReturnType<typeof useAppTheme>;
}) {
  return (
    <View style={styles.column}>
      <View
        style={[
          styles.iconZone,
          focused && { backgroundColor: theme.colors.accent, borderRadius: theme.radii.xl - 1 },
        ]}>
        <SymbolView
          tintColor={focused ? theme.colors.tabIconActive : theme.colors.tabIcon}
          size={22}
          name={(focused && iconActive) || icon}
        />
      </View>
      <Text
        numberOfLines={1}
        style={[
          styles.label,
          {
            color: focused ? (theme.dark ? theme.colors.accent : theme.colors.text) : theme.colors.tabIcon,
            fontFamily: focused ? 'Inter_700Bold' : 'Inter_500Medium',
          },
        ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    alignItems: 'center',
    gap: 4,
  },
  iconZone: {
    width: ICON_ZONE.width,
    height: ICON_ZONE.height,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.2,
  },
});
