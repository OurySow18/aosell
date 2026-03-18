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
    fontSize: 15,
    lineHeight: 23,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 19,
  },
  label: {
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  headline: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  display: {
    fontSize: 46,
    lineHeight: 50,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  button: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  code: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    lineHeight: 18,
  },
});
