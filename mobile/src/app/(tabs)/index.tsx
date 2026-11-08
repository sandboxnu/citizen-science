import { useEffect, useRef, useState } from 'react';
import { signOut } from '@react-native-firebase/auth';
import { StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertSheet } from '@/components/alert-sheet';
import { MapFilterBar } from '@/components/map-filter-bar';
import {
  DEFAULT_MAP_OVERLAY_FILTERS,
  MapOverlaySheet,
  type MapOverlayFilters,
} from '@/components/map-overlay-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing, UserLocationColors } from '@/constants/theme';
import { auth } from '@/lib/firebase';
import { subscribeToNwsAlerts, type NwsAlert } from '@/lib/nws-alerts';
import { StartReport } from '@/components/start-report';
import { ACTIVE_DURATION_MS, RecenterButton } from '@/components/recenter-button';

// Richards Hall, Northeastern University.
const MOCK_USER_LOCATION = { latitude: 42.3399, longitude: -71.0889 };
const MOCK_LOCATION_ACCURACY_METERS = 93;

const DEFAULT_REGION = {
  ...MOCK_USER_LOCATION,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const [nwsAlerts, setNwsAlerts] = useState<NwsAlert[]>([]);
  const [error, setError] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<NwsAlert | null>(null);
  const [overlayFilters, setOverlayFilters] = useState<MapOverlayFilters>(DEFAULT_MAP_OVERLAY_FILTERS);
  const [overlaySheetOpen, setOverlaySheetOpen] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(
    () =>
      subscribeToNwsAlerts(
        (alerts) => {
          setNwsAlerts(alerts);
          setError(false);
        },
        () => setError(true)
      ),
    []
  );

  const recenterMap = () => {
    mapRef.current?.animateToRegion({
     ...DEFAULT_REGION
    }, ACTIVE_DURATION_MS); 
  };


  return (
    <ThemedView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
      >
        {(overlayFilters.flooding ? nwsAlerts : []).flatMap((alert) =>
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
          fillColor={UserLocationColors.radiusFill}
          strokeColor={UserLocationColors.radiusStroke}
          strokeWidth={1.5}
        />
        <Marker coordinate={MOCK_USER_LOCATION} anchor={{ x: 0.5, y: 0.5 }} tracksViewChanges={false}>
          <View style={styles.userDot} />
        </Marker>
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <MapFilterBar
          filters={overlayFilters}
          onOpenOverlay={() => setOverlaySheetOpen(true)}
          onChange={setOverlayFilters}
        />
        {error && (
          <ThemedText type="small" themeColor="textSecondary">
            Couldn&apos;t load flood alerts.
          </ThemedText>
        )}
      </SafeAreaView>

      <StartReport onOpen={() => console.log('Start Report pressed')} />
      <RecenterButton onRecenter={() => recenterMap()} />

      <AlertSheet alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      <MapOverlaySheet
        visible={overlaySheetOpen}
        filters={overlayFilters}
        onSave={(filters) => {
          setOverlayFilters(filters);
          setOverlaySheetOpen(false);
        }}
        onClose={() => setOverlaySheetOpen(false)}
      />
    </ThemedView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: UserLocationColors.dot,
    borderWidth: 4,
    borderColor: UserLocationColors.dotBorder,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.five,
    paddingTop: Spacing.ten,
    gap: Spacing.two,
  },
});
