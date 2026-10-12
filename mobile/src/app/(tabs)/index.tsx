import { useEffect, useState } from 'react';
import { signOut } from '@react-native-firebase/auth';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { fetchHazardZones, type HazardZone } from '@/lib/hazard-zones';

// Centered roughly on NC (covers the state from the mountains to the coast).
const NC_REGION = {
  latitude: 35.5,
  longitude: -79.0,
  latitudeDelta: 4.5,
  longitudeDelta: 4.5,
};

export default function MapScreen() {
  const { user } = useAuth();
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchHazardZones()
      .then((zones) => {
        if (isMounted) setHazardZones(zones);
      })
      .catch(() => {
        if (isMounted) setError(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <ThemedView style={styles.container}>
      <MapView style={styles.map} initialRegion={NC_REGION}>
        {hazardZones.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates}
            fillColor="rgba(255,0,0,0.2)"
            strokeColor="rgba(255,0,0,0.8)"
          />
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']}>
        <ThemedText type="small">Signed in as {user?.email}</ThemedText>
        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load hazard zones.
          </ThemedText>
        )}
        <Pressable onPress={() => signOut(auth)}>
          <ThemedText type="linkPrimary">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
  },
});
