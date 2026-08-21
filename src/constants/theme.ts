import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  text: '#35150C',
  textSecondary: '#6E625D',
  background: '#EEEEEE',
  backgroundElement: '#FFFFFF',
  backgroundSelected: '#F4ECE6',
  border: '#DED5CF',
  earth: '#35150C',
  gold: '#F3A712',
  burntOrange: '#BF3813',
  forestGreen: '#16813A',
  success: '#16813A',
  warning: '#D97706',
  error: '#C93C2F',
  accent: '#F3A712',
  clay: '#7B4A2E',
  coral: '#BF3813',
  overlay: 'rgba(53, 21, 12, 0.26)',
} as const;

export type ThemeColor = keyof typeof Colors;

export const Fonts = {
  heading: Platform.select({
    ios: 'Poppins',
    android: 'Poppins',
    web: 'var(--font-heading)',
    default: 'System',
  }),
  body: Platform.select({
    ios: 'Inter',
    android: 'Inter',
    web: 'var(--font-body)',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: 'var(--font-mono)',
    default: 'monospace',
  }),
};

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
  xlarge: 32,
  pill: 999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
} as const;

export const MaxContentWidth = 1180;

export const BottomTabBarHeight = 68;
export const BottomTabBarGap = 10;
