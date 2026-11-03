import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { router, Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { WebHeader } from '@/components/web/web-header';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';

const TAB_CONTENT_HEIGHT = 56;
const ICON_ZONE = { width: 56, height: 30 };

export default function TabsLayout() {
  const theme = useAppTheme();
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  const breakpoint = useBreakpoint();
  const isWebChrome = Platform.OS === 'web' && breakpoint !== 'mobile';

  return (
    <View style={styles.root}>
      {isWebChrome ? <WebHeader breakpoint={breakpoint} /> : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: isWebChrome
            ? { display: 'none' }
            : {
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
        name="reels"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              label={t('tabs.reels')}
              icon={{ ios: 'play.rectangle.on.rectangle', android: 'dynamic_feed', web: 'dynamic_feed' }}
              iconActive={{ ios: 'play.rectangle.fill', android: 'dynamic_feed', web: 'dynamic_feed' }}
              theme={theme}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          tabBarButton: (props) => <AddTabButton {...props} theme={theme} />,
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
      </Tabs>
    </View>
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

// Opens post creation directly instead of navigating to the hidden "add" tab
// screen — Instagram/TikTok-style center "+" button, not a real destination.
function AddTabButton({ theme }: BottomTabBarButtonProps & { theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View style={styles.addButtonColumn}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/post/create')}
        style={({ pressed }) => [
          styles.addButton,
          { backgroundColor: theme.colors.accent, opacity: pressed ? 0.85 : 1 },
        ]}>
        <SymbolView tintColor={theme.colors.onAccent} size={24} name={{ ios: 'plus', android: 'add', web: 'add' }} />
      </Pressable>
    </View>
  );
}

const ADD_BUTTON_SIZE = 46;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  addButtonColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: ADD_BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
