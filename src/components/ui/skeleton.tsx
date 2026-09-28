import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useAppTheme } from '@/hooks/use-theme';

export function Skeleton({
  width,
  height,
  radius,
  image = false,
  style,
}: {
  width?: number | `${number}%`;
  height: number;
  radius?: number;
  image?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useAppTheme();

  return (
    <View
      style={[
        styles.base,
        {
          width,
          height,
          borderRadius: radius ?? theme.radii.sm,
          backgroundColor: image ? theme.colors.surfaceMuted : theme.colors.border,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: 'hidden' },
});
