import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { useAppTheme } from '@/hooks/use-theme';
import type { GeoPoint } from '@/types/domain';

// Isolated in its own file so `orders/[orderId].tsx` can load it with
// `React.lazy()`: react-native-maps needs a native module compiled into the
// dev client binary, and a static top-level import throws synchronously
// during module evaluation if that binary predates the dependency — which
// an error boundary around a plain <MapView> cannot catch. Loading this
// module dynamically turns that same throw into a rejected promise, which
// React.lazy + an error boundary around <Suspense> CAN catch.
export default function OrderTrackingMap({
  sellerLocation,
  homeLocation,
  sellerName,
  deliveryName,
}: {
  sellerLocation: GeoPoint;
  homeLocation: GeoPoint;
  sellerName?: string;
  deliveryName: string;
}) {
  const theme = useAppTheme();
  const mapRegion = {
    latitude: (sellerLocation.lat + homeLocation.lat) / 2,
    longitude: (sellerLocation.lng + homeLocation.lng) / 2,
    latitudeDelta: Math.max(Math.abs(sellerLocation.lat - homeLocation.lat) * 2.2, 0.02),
    longitudeDelta: Math.max(Math.abs(sellerLocation.lng - homeLocation.lng) * 2.2, 0.02),
  };

  return (
    <View style={[styles.mapWrap, { borderRadius: theme.radii.xl }]}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={mapRegion} pointerEvents="none">
        <Marker coordinate={{ latitude: sellerLocation.lat, longitude: sellerLocation.lng }} title={sellerName}>
          <View style={[styles.mapPinStore, { backgroundColor: theme.colors.text }]}>
            <Text style={styles.mapPinStoreText}>{(sellerName ?? '??').slice(0, 2).toUpperCase()}</Text>
          </View>
        </Marker>
        <Marker coordinate={{ latitude: homeLocation.lat, longitude: homeLocation.lng }} title={deliveryName}>
          <View style={[styles.mapPinHome, { backgroundColor: theme.colors.surface, borderColor: theme.colors.text }]}>
            <SymbolView tintColor={theme.colors.text} size={16} name={{ ios: 'house.fill', android: 'home', web: 'home' }} />
          </View>
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  mapWrap: { height: 220, overflow: 'hidden' },
  mapPinStore: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  mapPinStoreText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  mapPinHome: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
