import { Pressable, StyleSheet, View } from 'react-native';

import { Radius, Shadows, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type AppButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  fullWidth?: boolean;
  disabled?: boolean;
};

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
}: AppButtonProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'primary'
      ? theme.accent
      : variant === 'secondary'
        ? theme.backgroundSelected
        : variant === 'danger'
          ? theme.error
          : theme.backgroundElement;

  const textColor =
    variant === 'primary' ? theme.earth : variant === 'danger' ? '#FFFFFF' : theme.text;

  const borderColor =
    variant === 'primary' || variant === 'danger' ? backgroundColor : theme.border;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        [styles.base, { backgroundColor, borderColor }],
        variant === 'primary' && Shadows.card,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <View style={styles.inner}>
        <ThemedText type="button" style={{ color: textColor }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  base: {
    borderWidth: 1,
  },
  inner: {
    minHeight: 56,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
