import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useLocale } from '@/hooks/use-locale';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
  const { t } = useLocale();
  const [draft, setDraft] = useState('');

  const normalizedDraft = normalizeCondimentText(draft);
  const filteredSuggestions = normalizedDraft
    ? suggestions
        .filter(
          (condiment) =>
            condiment.normalizedName.includes(normalizedDraft) ||
            condiment.aliases.some((alias) => normalizeCondimentText(alias).includes(normalizedDraft))
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
      <ThemedText type="label" themeColor="textSecondary">
        {label}
      </ThemedText>

      <View style={[styles.inputRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <TextInput
          onChangeText={setDraft}
          onSubmitEditing={() => commit(draft)}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          returnKeyType="done"
          style={[styles.input, { color: theme.text }]}
          value={draft}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => commit(draft)}
          style={[styles.addButton, { backgroundColor: theme.accent }]}>
          <SymbolView tintColor={theme.earth} size={18} name={{ ios: 'plus', android: 'add', web: 'add' }} />
        </Pressable>
      </View>

      {filteredSuggestions.length ? (
        <View style={[styles.suggestions, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          {filteredSuggestions.map((condiment) => (
            <Pressable key={condiment.id} onPress={() => commit(condiment.name)} style={styles.suggestionRow}>
              <ThemedText type="body">{condiment.name}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}

      {values.length ? (
        <View style={styles.chipRow}>
          {values.map((value, index) => (
            <View key={`${value}-${index}`} style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="label" style={{ color: theme.text }}>
                {value}
              </ThemedText>
              <Pressable
                accessibilityLabel={t('listingEditor.removeCondiment', { name: value })}
                accessibilityRole="button"
                onPress={() => remove(index)}
                style={styles.chipRemove}>
                <SymbolView tintColor={theme.textSecondary} size={12} name={{ ios: 'xmark', android: 'close', web: 'close' }} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.medium,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
  },
  input: {
    flex: 1,
    minHeight: 54,
    fontSize: 16,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestions: {
    borderWidth: 1,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  chipRemove: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
