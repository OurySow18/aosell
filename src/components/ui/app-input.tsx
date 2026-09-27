import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
} & Pick<TextInputProps, 'autoCapitalize' | 'autoCorrect' | 'inputMode' | 'keyboardType' | 'secureTextEntry' | 'textContentType'>;

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
  const theme = useAppTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <TextInput
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        inputMode={inputMode}
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        secureTextEntry={secureTextEntry}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceMuted,
            color: theme.colors.text,
            borderColor: theme.colors.border,
            borderRadius: theme.radii.md,
            fontFamily: theme.typography.body.fontFamily,
            minHeight: multiline ? 120 : 52,
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
  wrapper: { gap: 6 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  input: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
});
