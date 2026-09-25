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

// ---------------------------------------------------------------------------
// "Mangue" design system (design handoff, sept. 2026) — replaces the palette
// above screen by screen. Kept alongside the legacy exports so screens not
// yet migrated keep compiling; once every screen uses `useAppTheme()` the
// exports above this line can be deleted.
// Contrastes WCAG vérifiés sur le fond correspondant (ratio indiqué en commentaire).
// ---------------------------------------------------------------------------

export const palette = {
  ink: '#14213D',          // 15,3:1 sur background
  background: '#FAFAF7',
  surface: '#FFFFFF',
  accent: '#FFB400',       // surfaces uniquement (1,7:1 sur fond) — texte dessus : ink (9,0:1)
  accentTint: '#FFF0C7',   // fonds d'images, états sélectionnés — ink dessus 14,2:1
  secondary: '#FF5A5F',    // badges, promos, notifications — texte dessus : ink (5,3:1)
  secondaryStrong: '#E5484D', // icônes (cœur « aimé ») sur fond clair — 3,8:1
  secondaryText: '#C8313A',   // prix promo, petit texte — 5,1:1
} as const;

export const lightColors = {
  background: palette.background,
  surface: palette.surface,
  surfaceMuted: '#F2F1EC',
  border: '#E8E6DF',
  borderStrong: '#D5D3CC',
  text: palette.ink,
  textMuted: '#5B6478',       // 5,7:1
  textDisabled: '#9AA1B0',    // non informatif uniquement
  accent: palette.accent,
  onAccent: palette.ink,
  accentTint: palette.accentTint,
  accentTintBorder: '#FFD266',
  secondary: palette.secondary,
  onSecondary: palette.ink,
  secondaryStrong: palette.secondaryStrong,
  secondaryText: palette.secondaryText,
  tabBar: palette.surface,
  tabIcon: '#5B6478',
  tabIconActive: palette.ink, // sur pastille accent
  success: '#177A41',   // 5,2:1
  successTint: '#E3F4E9',
  warning: '#B45309',   // 4,9:1
  warningTint: '#FDEBD9',
  error: '#C62828',     // 5,4:1
  errorTint: '#FBE4E4',
  overlay: 'rgba(20,33,61,0.55)',
  imagePlaceholder: palette.accentTint,
} as const;

export const darkColors: { [K in keyof typeof lightColors]: string } = {
  background: '#0E1628',
  surface: '#17223A',
  surfaceMuted: '#1D2942',
  border: '#26314A',
  borderStrong: '#35415C',
  text: '#F3F1EA',            // 16:1
  textMuted: '#A3ABBD',       // 7,8:1
  textDisabled: '#5F6880',
  accent: palette.accent,     // 10,1:1 sur background — utilisable pour icônes
  onAccent: palette.ink,
  accentTint: '#3A2E0E',
  accentTintBorder: '#6B5210',
  secondary: '#FF6B70',
  onSecondary: palette.ink,
  secondaryStrong: '#FF6B70',
  secondaryText: '#FF8A8E',   // 7,2:1
  tabBar: '#121C31',
  tabIcon: '#A3ABBD',
  tabIconActive: palette.ink,
  success: '#4CC38A',
  successTint: '#12301F',
  warning: '#F0A04B',
  warningTint: '#3A2710',
  error: '#FF7A7A',
  errorTint: '#3A1717',
  overlay: 'rgba(0,0,0,0.6)',
  imagePlaceholder: '#2B2410',
};

export const radii = {
  xs: 6,     // petits badges
  sm: 8,     // badges
  md: 12,    // vignettes, champs compacts
  lg: 14,    // champs, boutons
  xl: 16,    // cartes, boutons principaux
  sheet: 24, // bottom sheets
  pill: 999, // chips, pastilles
} as const;

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
  screenX: 20,    // marge latérale des écrans
  section: 28,    // entre deux sections
  hitTarget: 44,  // cible tactile minimale
} as const;

export const typography = {
  fontFamily: {
    heading: 'Poppins_700Bold',
    headingSemi: 'Poppins_600SemiBold',
    headingHeavy: 'Poppins_800ExtraBold',
    body: 'Inter_400Regular',
    bodyMedium: 'Inter_500Medium',
    bodySemi: 'Inter_600SemiBold',
  },
  // taille / interlignage
  display: { fontFamily: 'Poppins_700Bold', fontSize: 28, lineHeight: 34 },
  title:   { fontFamily: 'Poppins_700Bold', fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: 'Poppins_600SemiBold', fontSize: 17, lineHeight: 24 },
  body:    { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22 },
  label:   { fontFamily: 'Inter_600SemiBold', fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 },
  micro:   { fontFamily: 'Inter_600SemiBold', fontSize: 11, lineHeight: 14, letterSpacing: 0.2 },
} as const;

export const shadows = {
  none: {},
  sm: { shadowColor: '#14213D', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: '#14213D', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  lg: { shadowColor: '#14213D', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 10 },
  accent: { shadowColor: '#FFB400', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 6 },
} as const;
// En mode sombre, remplacer les ombres par une bordure 1px colors.border (les ombres sont peu visibles).

export const sizes = {
  buttonHeight: { sm: 36, md: 48, lg: 56 },
  inputHeight: 52,
  chipHeight: 36,
  tabBarHeight: 84, // 56 + zone de sécurité
  avatar: { sm: 32, md: 40, lg: 64 },
} as const;

export const motion = {
  fast: 120,
  base: 200,
  slow: 320,
  pressedScale: 0.97,
  disabledOpacity: 0.4,
} as const;

export const lightTheme = { dark: false, colors: lightColors, radii, spacing, typography, shadows, sizes, motion };
export const darkTheme = { dark: true, colors: darkColors, radii, spacing, typography, shadows, sizes, motion };
export type Theme = typeof lightTheme;
