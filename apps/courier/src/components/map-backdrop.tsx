import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

// Purely decorative stand-in for a map — abstract roads/water, not a real
// map. Fixed colors regardless of theme, same as the design reference.
export function MapBackdrop({ height, children }: { height: number; children?: ReactNode }) {
  return (
    <View style={[styles.root, { height }]}>
      <View style={styles.water} />
      <View style={[styles.road, styles.roadA]} />
      <View style={[styles.road, styles.roadB]} />
      <View style={[styles.roadVertical, styles.roadV1]} />
      <View style={[styles.roadVertical, styles.roadV2]} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'relative', overflow: 'hidden', backgroundColor: '#E8EDF3' },
  water: { position: 'absolute', left: -80, top: '28%', width: 600, height: 54, backgroundColor: '#BFD9F2', transform: [{ rotate: '-24deg' }] },
  road: { position: 'absolute', left: -40, width: 520, height: 10, backgroundColor: '#FFFFFF' },
  roadA: { top: '14%', transform: [{ rotate: '12deg' }] },
  roadB: { top: '48%', height: 12, transform: [{ rotate: '-6deg' }] },
  roadVertical: { position: 'absolute', top: -40, width: 10, height: '120%', backgroundColor: '#FFFFFF' },
  roadV1: { left: 140, transform: [{ rotate: '14deg' }] },
  roadV2: { left: 290, width: 8, transform: [{ rotate: '-10deg' }] },
});
