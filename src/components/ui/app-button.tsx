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
      ? theme.earth
      : variant === 'secondary'
        ? theme.gold
        : variant === 'danger'
          ? theme.error
          : 'transparent';

  const textColor =
    variant === 'ghost' ? theme.text : variant === 'secondary' ? theme.earth : theme.background;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        fullWidth && styles.fullWidth,
        variant === 'ghost' && [styles.ghost, { borderColor: theme.border }],
        variant !== 'ghost' && [{ backgroundColor }, Shadows.card],
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
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  inner: {
    minHeight: 48,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  ghost: {
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
