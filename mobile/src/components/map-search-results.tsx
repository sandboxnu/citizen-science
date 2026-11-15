import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, MapSearchColors, Spacing } from '@/constants/theme';
import type { PlaceResult } from '@/lib/map-search';

type MapSearchResultsProps = {
  places: PlaceResult[];
  // The search hasn't answered the current query yet.
  loading?: boolean;
  // The search failed (offline, service error), rather than finding nothing.
  failed?: boolean;
  onRetry?: () => void;
  onSelectPlace: (place: PlaceResult) => void;
};

// Dropdown under the map search bar listing geocoded places.
export function MapSearchResults({ places, loading, failed, onRetry, onSelectPlace }: MapSearchResultsProps) {
  return (
    <View style={styles.card}>
      {loading ? (
        <View style={[styles.row, styles.titleRow]} accessibilityRole="progressbar" accessibilityLabel="Searching">
          <ActivityIndicator size="small" color={MapSearchColors.subtle} style={styles.icon} />
          <Text style={[styles.title, styles.loadingText]}>Searching...</Text>
        </View>
      ) : failed ? (
        <View style={[styles.row, styles.failedRow]}>
          <Text style={[styles.title, styles.failedText]}>Couldn&apos;t search right now.</Text>
          <Pressable onPress={onRetry} hitSlop={8} accessibilityRole="button" accessibilityLabel="Try search again">
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : places.length === 0 ? (
        <View style={styles.row}>
          <Text style={styles.title}>No results found.</Text>
        </View>
      ) : (
        places.map((place) => <PlaceRow key={place.id} place={place} onPress={() => onSelectPlace(place)} />)
      )}
    </View>
  );
}

function PlaceRow({ place, onPress }: { place: PlaceResult; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`Go to ${place.name}`}>
      <View style={styles.titleRow}>
        <Image source={require('@/assets/images/mapIcons/map-pin.svg')} style={styles.icon} />
        <Text style={styles.title} numberOfLines={1}>
          {place.name}
        </Text>
      </View>
      {place.subtitle && <Text style={styles.subtitle}>{place.subtitle}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.ten,
    padding: Spacing.ten,
    borderRadius: 8,
    backgroundColor: MapSearchColors.card,
  },
  row: {
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: MapSearchColors.divider,
  },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.one },
  icon: { width: 16, height: 16 },
  title: {
    flexShrink: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 17,
    color: MapSearchColors.text,
  },
  loadingText: { color: MapSearchColors.subtle },
  failedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  failedText: { flex: 1 },
  retry: { fontFamily: FontFamily.medium, fontSize: 14, color: MapSearchColors.action },
  subtitle: {
    paddingHorizontal: Spacing.eleven,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: MapSearchColors.subtle,
  },
});
