import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';

import { useTheme } from '@/hooks/use-theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.earth,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
          height: 76,
          paddingTop: 8,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'house.fill', android: 'home', web: 'house.fill' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
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
          title: 'Add',
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'plus.circle.fill', android: 'add', web: 'plus.circle.fill' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
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
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'person.fill', android: 'person', web: 'person.fill' }} />
          ),
        }}
      />
    </Tabs>
  );
}
