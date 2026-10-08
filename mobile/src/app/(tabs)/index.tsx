import { signOut } from '@react-native-firebase/auth';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import { useHazardZones } from '@/lib/hazard-zones';

const NORTH_CAROLINA = {
  latitude: 35.3,
  longitude: -79.4,
  latitudeDelta: 4.5,
  longitudeDelta: 8,
};

// Placeholder colors until designs land: [stroke, fill].
function zoneColors(event: string): [string, string] {
  if (event.includes('Warning')) return ['#D32F2F', 'rgba(211, 47, 47, 0.3)'];
  if (event.includes('Watch')) return ['#F57C00', 'rgba(245, 124, 0, 0.3)'];
  if (event.includes('Advisory')) return ['#FBC02D', 'rgba(251, 192, 45, 0.3)'];
  return ['#1976D2', 'rgba(25, 118, 210, 0.3)'];
}

export default function MapScreen() {
  const zones = useHazardZones();

  return (
    <ThemedView style={styles.container}>
      <MapView style={StyleSheet.absoluteFill} initialRegion={NORTH_CAROLINA}>
        {zones.flatMap((zone) => {
          const [strokeColor, fillColor] = zoneColors(zone.event);
          return zone.polygons.map((coordinates, i) => (
            <Polygon
              key={`${zone.id}-${i}`}
              coordinates={coordinates}
              strokeColor={strokeColor}
              fillColor={fillColor}
              strokeWidth={2}
            />
          ));
        })}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <Pressable onPress={() => signOut(auth)}>
          <ThemedView type="backgroundElement" style={styles.signOut}>
            <ThemedText type="linkPrimary">Sign out</ThemedText>
          </ThemedView>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.three,
  },
  signOut: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
});
