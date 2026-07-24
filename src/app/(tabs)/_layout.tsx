import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

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
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: '#C8BBB5',
        tabBarStyle: {
          backgroundColor: theme.earth,
          borderTopColor: 'transparent',
          height: 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 10 : 8,
          marginHorizontal: 12,
          marginBottom: 10,
          borderRadius: Radius.xlarge,
          position: 'absolute',
          borderWidth: 1,
          borderColor: '#593126',
          ...Shadows.float,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '800',
          letterSpacing: 0.2,
        },
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'house.fill', android: 'home', web: 'home' }} />
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
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: t('tabs.add'),
          tabBarIcon: () => (
            <View
              style={[
                styles.addButton,
                { backgroundColor: theme.accent, borderColor: theme.earth },
              ]}>
              <SymbolView
                tintColor={theme.earth}
                size={22}
                name={{ ios: 'plus', android: 'add', web: 'add' }}
              />
            </View>
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
              name={{ ios: 'shippingbox.fill', android: 'inbox', web: 'inbox' }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <SymbolView tintColor={color} size={18} name={{ ios: 'person.fill', android: 'person', web: 'person' }} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -13,
    borderWidth: 2,
  },
});
