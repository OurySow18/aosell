import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  disabled?: boolean;
};

export function AppButton({ label, onPress, variant = 'primary', fullWidth = false, disabled = false }: AppButtonProps) {
  const theme = useAppTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.colors.accent
      : variant === 'secondary'
        ? theme.colors.surfaceMuted
        : variant === 'danger'
          ? theme.colors.error
          : theme.colors.surface;

  const textColor = variant === 'primary' ? theme.colors.onAccent : variant === 'danger' ? '#FFFFFF' : theme.colors.text;

  const borderColor = variant === 'primary' || variant === 'danger' ? backgroundColor : theme.colors.border;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        { borderRadius: theme.radii.md },
        fullWidth && styles.fullWidth,
        [styles.base, { backgroundColor, borderColor }],
        variant === 'primary' && theme.shadows.sm,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.inner}>
        <Text style={[styles.label, { color: textColor, fontFamily: theme.typography.label.fontFamily }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { overflow: 'hidden' },
  base: { borderWidth: 1 },
  inner: { minHeight: 52, paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 15, lineHeight: 20 },
  fullWidth: { width: '100%' },
  pressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
});
