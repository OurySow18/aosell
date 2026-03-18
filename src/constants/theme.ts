import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#111111',
    textSecondary: '#6D6D6D',
    background: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F3F3F3',
    border: '#E8E8E8',
    earth: '#111111',
    gold: '#F4D9E1',
    burntOrange: '#06C167',
    forestGreen: '#06C167',
    success: '#06C167',
    warning: '#DFF7E9',
    error: '#E8194E',
    overlay: 'rgba(17, 17, 17, 0.08)',
  },
  dark: {
    text: '#FFFFFF',
    textSecondary: '#B9B9B9',
    background: '#0F0F0F',
    backgroundElement: '#171717',
    backgroundSelected: '#232323',
    border: '#2E2E2E',
    earth: '#FFFFFF',
    gold: '#39262C',
    burntOrange: '#32D74B',
    forestGreen: '#32D74B',
    success: '#32D74B',
    warning: '#1E2C22',
    error: '#FF4D7D',
    overlay: 'rgba(0, 0, 0, 0.35)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

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
  small: 12,
  medium: 18,
  large: 22,
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
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
} as const;

export const MaxContentWidth = 1180;

export const BottomTabInset = Platform.select({
  ios: 8,
  android: 12,
  default: 0,
});
