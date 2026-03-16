import { StyleSheet, TextInput, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
};

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}: AppInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundElement,
            color: theme.text,
            borderColor: theme.border,
            minHeight: multiline ? 120 : 50,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
});
