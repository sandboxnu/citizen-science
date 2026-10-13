import { useCallback, useEffect, useState } from 'react';
import { signOut } from '@react-native-firebase/auth';
import { Pressable, StyleSheet } from 'react-native';
import MapView, { Circle, Polygon, type LatLng, type UserLocationChangeEvent } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { fetchHazardZones, type HazardZone } from '@/lib/hazard-zones';

const DEFAULT_REGION = {
  latitude: 36.5613,
  longitude: -80.7893,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { user } = useAuth();
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);
  const [error, setError] = useState(false);
  const [userLocation, setUserLocation] = useState<{ coordinate: LatLng; accuracy: number } | null>(null);

  const handleUserLocationChange = useCallback((event: UserLocationChangeEvent) => {
    const coordinate = event.nativeEvent.coordinate;
    if (!coordinate) return;
    setUserLocation({
      coordinate: { latitude: coordinate.latitude, longitude: coordinate.longitude },
      accuracy: coordinate.accuracy,
    });
  }, []);

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
      <MapView
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        showsUserLocation
        onUserLocationChange={handleUserLocationChange}
      >
        {hazardZones.flatMap((zone) =>
          zone.rings.map((ring, i) => (
            <Polygon
              key={`${zone.id}-${i}`}
              coordinates={ring}
              fillColor="rgba(33,150,243,0.5)"
              strokeColor="rgba(13,71,161,0.9)"
              strokeWidth={2}
            />
          ))
        )}
        {userLocation && (
          <Circle
            center={userLocation.coordinate}
            radius={userLocation.accuracy}
            fillColor="rgba(0,122,255,0.15)"
            strokeColor="rgba(0,122,255,0.3)"
            strokeWidth={1}
          />
        )}
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
