import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1C1C',
    textSecondary: '#6F6258',
    background: '#F5EFE6',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E4DDD3',
    border: '#D6CFC5',
    earth: '#2B1B12',
    gold: '#D08A1E',
    burntOrange: '#C85A1A',
    forestGreen: '#1F4D2B',
    success: '#3F6F52',
    warning: '#E6A64C',
    error: '#B64B2A',
    overlay: 'rgba(28, 28, 28, 0.18)',
  },
  dark: {
    text: '#F5EFE6',
    textSecondary: '#D6CFC5',
    background: '#15110E',
    backgroundElement: '#241B16',
    backgroundSelected: '#3A2A21',
    border: '#5C4B3F',
    earth: '#F5EFE6',
    gold: '#D08A1E',
    burntOrange: '#E07B40',
    forestGreen: '#5E9570',
    success: '#68A27A',
    warning: '#F0C067',
    error: '#D46E50',
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
  small: 10,
  medium: 16,
  large: 24,
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
    shadowColor: '#2B1B12',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

export const MaxContentWidth = 1180;

export const BottomTabInset = Platform.select({
  ios: 8,
  android: 12,
  default: 0,
});
