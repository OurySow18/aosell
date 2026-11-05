import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={[styles.track, { backgroundColor: theme.colors.surfaceMuted, borderRadius: theme.radii.md }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.segment,
              { borderRadius: theme.radii.sm + 1 },
              active && [{ backgroundColor: theme.colors.surface }, theme.shadows.sm],
            ]}>
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                {
                  color: active ? theme.colors.text : theme.colors.textMuted,
                  fontFamily: active ? theme.typography.label.fontFamily : theme.typography.caption.fontFamily,
                },
              ]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', height: 40, padding: 4, gap: 4 },
  segment: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13, lineHeight: 18 },
});
