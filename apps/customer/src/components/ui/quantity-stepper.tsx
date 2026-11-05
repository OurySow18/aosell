import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function QuantityStepper({
  value,
  onDecrease,
  onIncrease,
  variant = 'outline',
  style,
}: {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  variant?: 'outline' | 'solid';
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();
  const solid = variant === 'solid';
  const textColor = solid ? '#FFFFFF' : theme.colors.text;

  return (
    <View
      style={[
        solid ? styles.solidTrack : styles.outlineTrack,
        {
          borderRadius: theme.radii.pill,
          backgroundColor: solid ? theme.colors.text : 'transparent',
          borderColor: solid ? undefined : theme.colors.borderStrong,
        },
        style,
      ]}>
      <Pressable onPress={onDecrease} style={solid ? styles.solidButton : styles.outlineButton}>
        <Text style={[styles.buttonText, { color: textColor }]}>−</Text>
      </Pressable>
      <Text style={[styles.value, { color: textColor, fontFamily: theme.typography.label.fontFamily }]}>{value}</Text>
      <Pressable onPress={onIncrease} style={solid ? styles.solidButton : styles.outlineButton}>
        <Text style={[styles.buttonText, { color: textColor }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outlineTrack: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, height: 36, paddingHorizontal: 4, gap: 10 },
  outlineButton: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  solidTrack: { flexDirection: 'row', alignItems: 'center', height: 34, paddingHorizontal: 6, gap: 8 },
  solidButton: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 17, lineHeight: 19, fontWeight: '700' },
  value: { fontSize: 15, lineHeight: 20, minWidth: 16, textAlign: 'center' },
});
