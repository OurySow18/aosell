import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CourierVehicleType } from '@aosell/core';

import { Icon } from '@/components/icon';
import type { IconName } from '@/components/icon';
import type { AppTheme } from '@/hooks/use-theme';
import { useLocale } from '@/lib/i18n';

const OPTIONS: CourierVehicleType[] = ['bike', 'scooter', 'car'];
export const VEHICLE_ICON: Record<CourierVehicleType, IconName> = { bike: 'bike', scooter: 'scooter', car: 'car' };

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
              { borderColor: theme.colors.border, borderRadius: theme.radii.lg },
              isSelected && { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
            ]}>
            <Icon color={isSelected ? theme.colors.onAccent : theme.colors.textMuted} name={VEHICLE_ICON[option]} size={22} />
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
  chip: { flex: 1, borderWidth: 2, paddingVertical: 12, alignItems: 'center', gap: 6 },
  chipText: { fontSize: 12, fontWeight: '700' },
});
