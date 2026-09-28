import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View, Text } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

type AppInputProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  error?: string;
  valid?: boolean;
  validMessage?: string;
} & Pick<TextInputProps, 'autoCapitalize' | 'autoCorrect' | 'inputMode' | 'keyboardType' | 'secureTextEntry' | 'textContentType'>;

export function AppInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  disabled = false,
  error,
  valid = false,
  validMessage,
  autoCapitalize,
  autoCorrect,
  inputMode,
  keyboardType,
  secureTextEntry,
  textContentType,
}: AppInputProps) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : valid
      ? theme.colors.success
      : isFocused
        ? theme.colors.text
        : theme.colors.border;
  const borderWidth = error || valid ? 1.5 : isFocused ? 2 : 1;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>
      <View
        style={[
          styles.haloWrap,
          { borderRadius: theme.radii.md + 4 },
          isFocused && !disabled && { backgroundColor: theme.colors.accentTint },
        ]}>
        <View style={styles.fieldRow}>
          <TextInput
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            editable={!disabled}
            inputMode={inputMode}
            keyboardType={keyboardType}
            multiline={multiline}
            onBlur={() => setIsFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry={secureTextEntry}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surfaceMuted,
                color: disabled ? theme.colors.textDisabled : theme.colors.text,
                borderColor: disabled ? 'transparent' : borderColor,
                borderWidth: disabled ? 0 : borderWidth,
                borderRadius: theme.radii.md,
                fontFamily: theme.typography.body.fontFamily,
                minHeight: multiline ? 120 : 52,
                textAlignVertical: multiline ? 'top' : 'center',
              },
            ]}
            textContentType={textContentType}
            value={value}
          />
          {valid && !error ? (
            <SymbolView
              tintColor={theme.colors.success}
              size={18}
              name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
              style={styles.validIcon}
            />
          ) : null}
        </View>
      </View>
      {error ? (
        <Text style={[styles.message, { color: theme.colors.error }]}>{error}</Text>
      ) : valid && validMessage ? (
        <Text style={[styles.message, { color: theme.colors.success }]}>{validMessage}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  haloWrap: { padding: 4, margin: -4 },
  fieldRow: { position: 'relative', justifyContent: 'center' },
  input: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  validIcon: { position: 'absolute', right: 14 },
  message: { fontSize: 13, lineHeight: 18 },
});
