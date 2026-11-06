import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CourierVehicleType } from '@aosell/core';

import type { AppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';

const OPTIONS: CourierVehicleType[] = ['bike', 'scooter', 'car'];

export function VehicleSelect({
  value,
  onChange,
  theme,
}: {
  value?: CourierVehicleType;
  onChange: (vehicleType: CourierVehicleType) => void;
  theme: AppTheme;
}) {
  const { t } = useLocale();

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const isSelected = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[
              styles.chip,
              { borderColor: theme.colors.border, borderRadius: theme.radii.pill },
              isSelected && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
            ]}>
            <Text style={[styles.chipText, { color: isSelected ? theme.colors.onAccent : theme.colors.text }]}>
              {t(`vehicle.${option}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, borderWidth: 2, paddingVertical: 10, alignItems: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
});
