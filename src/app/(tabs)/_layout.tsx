import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform } from 'react-native';

import { Radius, Shadows } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.earth,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: 'transparent',
          height: 78,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 12 : 10,
          marginHorizontal: 14,
          marginBottom: 12,
          borderRadius: Radius.large,
          position: 'absolute',
          ...Shadows.card,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'house.fill', android: 'home', web: 'house.fill' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              tintColor={color}
              size={18}
              name={{ ios: 'magnifyingglass', android: 'search', web: 'magnifyingglass' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tabs.add'),
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={19} name={{ ios: 'plus.circle.fill', android: 'add', web: 'plus.circle.fill' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color }) => (
            <SymbolView
              tintColor={color}
              size={18}
              name={{ ios: 'shippingbox.fill', android: 'inbox', web: 'shippingbox.fill' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'person.fill', android: 'person', web: 'person.fill' }} />
          ),
        }}
      />
    </Tabs>
  );
}
