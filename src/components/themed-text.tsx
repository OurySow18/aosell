import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'body'
    | 'bodySmall'
    | 'label'
    | 'headline'
    | 'title'
    | 'display'
    | 'button'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = 'body',
  themeColor = 'text',
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        styles.base,
        { color: theme[themeColor] },
        type === 'body' && styles.body,
        type === 'bodySmall' && styles.bodySmall,
        type === 'label' && styles.label,
        type === 'headline' && styles.headline,
        type === 'title' && styles.title,
        type === 'display' && styles.display,
        type === 'button' && styles.button,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.body,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '800',
  },
  headline: {
    fontSize: 21,
    lineHeight: 27,
    fontFamily: Fonts.heading,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 31,
    lineHeight: 36,
    fontFamily: Fonts.heading,
    fontWeight: '800',
    letterSpacing: -0.9,
  },
  display: {
    fontSize: 42,
    lineHeight: 45,
    fontFamily: Fonts.heading,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
});
