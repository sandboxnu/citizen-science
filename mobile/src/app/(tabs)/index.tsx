import { useEffect, useState } from 'react';
import { signOut } from '@react-native-firebase/auth';
import { Pressable, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertSheet } from '@/components/alert-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';
import { fetchNwsAlerts, type NwsAlert } from '@/lib/nws-alerts';

const MOCK_USER_LOCATION = { latitude: 36.2, longitude: -81.7 };
const MOCK_LOCATION_ACCURACY_METERS = 30;

const DEFAULT_REGION = {
  ...MOCK_USER_LOCATION,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { user } = useAuth();
  const [nwsAlerts, setNwsAlerts] = useState<NwsAlert[]>([]);
  const [error, setError] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<NwsAlert | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchNwsAlerts()
      .then((alerts) => {
        if (isMounted) setNwsAlerts(alerts);
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
      >
        {nwsAlerts.flatMap((alert) =>
          alert.polygons.map((polygon, i) => (
            <Polygon
              key={`${alert.id}-${i}`}
              coordinates={polygon.outer}
              holes={polygon.holes}
              fillColor="rgba(33,150,243,0.5)"
              strokeColor="rgba(13,71,161,0.9)"
              strokeWidth={2}
              tappable
              onPress={() => setSelectedAlert(alert)}
            />
          ))
        )}
        <Circle
          center={MOCK_USER_LOCATION}
          radius={MOCK_LOCATION_ACCURACY_METERS}
          fillColor="rgba(0,122,255,0.15)"
          strokeColor="rgba(0,122,255,0.3)"
          strokeWidth={1}
        />
        <Marker coordinate={MOCK_USER_LOCATION} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.userDot} />
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']}>
        <ThemedText type="small">Signed in as {user?.email}</ThemedText>
        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load flood alerts.
          </ThemedText>
        )}
        <Pressable onPress={() => signOut(auth)}>
          <ThemedText type="linkPrimary">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>

      <AlertSheet alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgb(0,122,255)',
    borderWidth: 3,
    borderColor: 'white',
  },
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
