import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
} & Pick<
  TextInputProps,
  | 'autoCapitalize'
  | 'autoCorrect'
  | 'inputMode'
  | 'keyboardType'
  | 'secureTextEntry'
  | 'textContentType'
>;

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize,
  autoCorrect,
  inputMode,
  keyboardType,
  secureTextEntry,
  textContentType,
}: AppInputProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        inputMode={inputMode}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            backgroundColor: theme.backgroundSelected,
            color: theme.text,
            borderColor: theme.border,
            minHeight: multiline ? 124 : 54,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        textContentType={textContentType}
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
    borderRadius: Radius.large,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 15,
  },
});
