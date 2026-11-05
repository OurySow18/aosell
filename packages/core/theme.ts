// ---------------------------------------------------------------------------
// "Mangue" design system (design handoff, sept. 2026) — shared design tokens
// for every AoSell app. Each app's own useAppTheme hook picks light/dark from
// these; contrast ratios verified against the paired background (see
// apps/customer's original copy of this file for the audit notes).
// ---------------------------------------------------------------------------

export const MaxContentWidth = 1180;

export const palette = {
  ink: '#14213D',
  background: '#FAFAF7',
  surface: '#FFFFFF',
  accent: '#FFB400',
  accentTint: '#FFF0C7',
  secondary: '#FF5A5F',
  secondaryStrong: '#E5484D',
  secondaryText: '#C8313A',
} as const;

export const lightColors = {
  background: palette.background,
  surface: palette.surface,
  surfaceMuted: '#F2F1EC',
  border: '#E8E6DF',
  borderStrong: '#D5D3CC',
  text: palette.ink,
  textMuted: '#5B6478',
  textDisabled: '#9AA1B0',
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
  tabIconActive: palette.ink,
  success: '#177A41',
  successTint: '#E3F4E9',
  warning: '#B45309',
  warningTint: '#FDEBD9',
  error: '#C62828',
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
  text: '#F3F1EA',
  textMuted: '#A3ABBD',
  textDisabled: '#5F6880',
  accent: palette.accent,
  onAccent: palette.ink,
  accentTint: '#3A2E0E',
  accentTintBorder: '#6B5210',
  secondary: '#FF6B70',
  onSecondary: palette.ink,
  secondaryStrong: '#FF6B70',
  secondaryText: '#FF8A8E',
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
  xs: 6,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  sheet: 24,
  pill: 999,
} as const;

export const spacing = {
  0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48,
  screenX: 20,
  section: 28,
  hitTarget: 44,
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

export const sizes = {
  buttonHeight: { sm: 36, md: 48, lg: 56 },
  inputHeight: 52,
  chipHeight: 36,
  tabBarHeight: 84,
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
