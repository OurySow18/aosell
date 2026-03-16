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
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  headline: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: Fonts.heading,
    fontWeight: '700',
  },
  display: {
    fontSize: 42,
    lineHeight: 46,
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
