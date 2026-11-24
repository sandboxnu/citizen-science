import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Image } from 'expo-image';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';
import MapView, { Circle, Marker, Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertSheet } from '@/components/alert-sheet';
import { MapFilterBar } from '@/components/map-filter-bar';
import { MapSearchResults } from '@/components/map-search-results';
import {
  DEFAULT_MAP_OVERLAY_FILTERS,
  MapOverlaySheet,
  type MapOverlayFilters,
} from '@/components/map-overlay-sheet';
import { TimeframePopup } from '@/components/timeframe-popup';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { fetchHazardZones, type HazardZone } from '@/lib/hazard-zones';
import { Spacing, UserLocationColors } from '@/constants/theme';
import { searchPlaces, type PinnedPlace, type PlaceResult } from '@/lib/map-search';
import { subscribeToNwsAlerts, type NwsAlert } from '@/lib/nws-alerts';
import { DEFAULT_TIMEFRAME, isInTimeframe, type Timeframe } from '@/lib/timeframe';
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

// Wait for typing to pause before geocoding; the platform geocoder rate-limits.
const PLACE_SEARCH_DEBOUNCE_MS = 400;
const MIN_PLACE_QUERY_LENGTH = 2;
const MAP_ANIMATION_MS = 500;
// location-pin.svg is drawn at 24 x 32.27 with its tip at the bottom center.
const PIN_WIDTH = 24;
const PIN_HEIGHT = 32.27;

export default function MapScreen() {
  const [nwsAlerts, setNwsAlerts] = useState<NwsAlert[]>([]);
  const [error, setError] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<NwsAlert | null>(null);
  const [overlayFilters, setOverlayFilters] = useState<MapOverlayFilters>(DEFAULT_MAP_OVERLAY_FILTERS);
  const [overlaySheetOpen, setOverlaySheetOpen] = useState(false);
  const [hazardZones, setHazardZones] = useState<HazardZone[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchHazardZones()
      .then((zones) => {
        if (isMounted) setHazardZones(zones);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);
  const [timeframe, setTimeframe] = useState<Timeframe>(DEFAULT_TIMEFRAME);
  const [timeframePopupOpen, setTimeframePopupOpen] = useState(false);
  const mapRef = useRef<MapView>(null);

  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  // Search results tagged with the query they answer, so stale ones are ignored. `places` is
  // null when the search failed (offline, service error), as opposed to [] for no matches.
  const [placeSearch, setPlaceSearch] = useState<{ query: string; places: PlaceResult[] | null } | null>(
    null
  );
  // Bumped by "Try again" to rerun a failed search for the same query.
  const [searchAttempt, setSearchAttempt] = useState(0);
  const [pinnedPlace, setPinnedPlace] = useState<PinnedPlace | null>(null);
  const [pinLoaded, setPinLoaded] = useState(false);

  const trimmedQuery = query.trim();
  const searchesPlaces = searchOpen && trimmedQuery.length >= MIN_PLACE_QUERY_LENGTH;
  const placesAnswered = placeSearch?.query === trimmedQuery;
  const placeResults = searchesPlaces && placesAnswered ? placeSearch.places : [];
  const searchFailed = placeResults === null;

  useEffect(() => {
    if (!searchesPlaces) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const places = await searchPlaces(trimmedQuery, MOCK_USER_LOCATION);
      if (!cancelled) setPlaceSearch({ query: trimmedQuery, places });
    }, PLACE_SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchesPlaces, trimmedQuery, searchAttempt]);

  const retrySearch = () => {
    setPlaceSearch(null);
    setSearchAttempt((attempt) => attempt + 1);
  };

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

  const closeSearch = () => {
    Keyboard.dismiss();
    searchInputRef.current?.blur();
    setSearchOpen(false);
  };

  const selectPlace = async (place: PlaceResult) => {
    closeSearch();
    setQuery(place.name);
    const pinned = await place.resolve();
    if (!pinned) return;
    setPinnedPlace(pinned);
    mapRef.current?.animateToRegion(
      { ...pinned.coordinate, latitudeDelta: pinned.zoomDelta, longitudeDelta: pinned.zoomDelta },
      MAP_ANIMATION_MS
    );
  };

  const clearSearch = () => {
    setQuery('');
    setPinnedPlace(null);
  };


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
        onPress={() => searchOpen && closeSearch()}
      >
        {(overlayFilters.flooding ? nwsAlerts.filter((alert) => isInTimeframe(alert.sent, timeframe)) : []).flatMap((alert) =>
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
        {(overlayFilters.flooding ? hazardZones : []).flatMap((zone) =>
          zone.polygons.map((polygon, i) => (
            <Polygon
              key={`zone-${zone.id}-${i}`}
              coordinates={polygon.outer}
              holes={polygon.holes}
              fillColor="rgba(255,152,0,0.35)"
              strokeColor="rgba(230,81,0,0.9)"
              strokeWidth={2}
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
        {pinnedPlace && (
          <Marker
            key={pinnedPlace.id}
            coordinate={pinnedPlace.coordinate}
            // Put the pin's tip on the place: `anchor` for Google Maps (Android),
            // `centerOffset` for Apple Maps (iOS), which ignores `anchor`.
            anchor={{ x: 0.5, y: 1 }}
            centerOffset={{ x: 0, y: -PIN_HEIGHT / 2 }}
            tracksViewChanges={!pinLoaded}
            accessibilityLabel={pinnedPlace.name}>
            <Image
              source={require('@/assets/images/mapIcons/location-pin.svg')}
              style={styles.locationPin}
              onLoad={() => setPinLoaded(true)}
            />
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <MapFilterBar
          filters={overlayFilters}
          timeframe={timeframe}
          onOpenOverlay={() => setOverlaySheetOpen(true)}
          onOpenTimeframe={() => setTimeframePopupOpen(true)}
          onChange={setOverlayFilters}
          onTimeframeChange={setTimeframe}
          inputRef={searchInputRef}
          query={query}
          onChangeQuery={(text) => {
            setQuery(text);
            setSearchOpen(true);
            // Erasing the query by keyboard removes the pin, like the clear button.
            if (!text) setPinnedPlace(null);
          }}
          onFocusSearch={() => setSearchOpen(true)}
          onClearQuery={clearSearch}
          results={
            searchesPlaces ? (
              <MapSearchResults
                places={placeResults ?? []}
                loading={!placesAnswered}
                failed={searchFailed}
                onRetry={retrySearch}
                onSelectPlace={selectPlace}
              />
            ) : undefined
          }
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
      <TimeframePopup
        visible={timeframePopupOpen}
        timeframe={timeframe}
        onSave={(next) => {
          setTimeframe(next);
          setTimeframePopupOpen(false);
        }}
        onClose={() => setTimeframePopupOpen(false)}
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
  locationPin: { width: PIN_WIDTH, height: PIN_HEIGHT },
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
