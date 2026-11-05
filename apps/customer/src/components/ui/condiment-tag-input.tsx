import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/hooks/use-locale';
import { normalizeCondimentText } from '@/lib/condiments';
import type { Condiment } from '@/types/domain';

type CondimentTagInputProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions: Condiment[];
  placeholder?: string;
};

const MAX_SUGGESTIONS = 6;

export function CondimentTagInput({ label, values, onChange, suggestions, placeholder }: CondimentTagInputProps) {
  const theme = useAppTheme();
  const { t } = useLocale();
  const [draft, setDraft] = useState('');

  const normalizedDraft = normalizeCondimentText(draft);
  const filteredSuggestions = normalizedDraft
    ? suggestions
        .filter(
          (condiment) =>
            condiment.normalizedName.includes(normalizedDraft) ||
            condiment.aliases.some((alias) => normalizeCondimentText(alias).includes(normalizedDraft)),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  function commit(rawValue: string) {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      return;
    }

    const normalized = normalizeCondimentText(trimmed);
    const alreadyAdded = values.some((value) => normalizeCondimentText(value) === normalized);
    if (!alreadyAdded) {
      onChange([...values, trimmed]);
    }
    setDraft('');
  }

  function remove(index: number) {
    onChange(values.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: theme.colors.textMuted, fontFamily: theme.typography.micro.fontFamily }]}>{label}</Text>

      <View style={[styles.inputRow, { backgroundColor: theme.colors.surfaceMuted, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
        <TextInput
          onChangeText={setDraft}
          onSubmitEditing={() => commit(draft)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          returnKeyType="done"
          style={[styles.input, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}
          value={draft}
        />
        <Pressable accessibilityRole="button" onPress={() => commit(draft)} style={[styles.addButton, { backgroundColor: theme.colors.accent }]}>
          <SymbolView tintColor={theme.colors.onAccent} size={18} name={{ ios: 'plus', android: 'add', web: 'add' }} />
        </Pressable>
      </View>

      {filteredSuggestions.length ? (
        <View style={[styles.suggestions, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.md }]}>
          {filteredSuggestions.map((condiment) => (
            <Pressable key={condiment.id} onPress={() => commit(condiment.name)} style={styles.suggestionRow}>
              <Text style={[styles.body, { color: theme.colors.text, fontFamily: theme.typography.body.fontFamily }]}>{condiment.name}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {values.length ? (
        <View style={styles.chipRow}>
          {values.map((value, index) => (
            <View key={`${value}-${index}`} style={[styles.chip, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.pill }]}>
              <Text style={[styles.chipLabel, { color: theme.colors.text, fontFamily: theme.typography.label.fontFamily }]}>{value}</Text>
              <Pressable
                accessibilityLabel={t('listingEditor.removeCondiment', { name: value })}
                accessibilityRole="button"
                onPress={() => remove(index)}
                style={styles.chipRemove}>
                <SymbolView tintColor={theme.colors.textMuted} size={12} name={{ ios: 'xmark', android: 'close', web: 'close' }} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, paddingLeft: 14, paddingRight: 4 },
  input: { flex: 1, minHeight: 52, fontSize: 15 },
  addButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  suggestions: { borderWidth: 1, overflow: 'hidden' },
  suggestionRow: { paddingHorizontal: 14, paddingVertical: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 12, paddingRight: 8, paddingVertical: 6 },
  chipRemove: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, lineHeight: 14, textTransform: 'uppercase', letterSpacing: 0.2 },
  body: { fontSize: 15, lineHeight: 20 },
  chipLabel: { fontSize: 13, lineHeight: 18 },
});
