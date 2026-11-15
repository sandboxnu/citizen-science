import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, MapSearchColors, Spacing } from '@/constants/theme';
import type { PlaceResult } from '@/lib/map-search';

type MapSearchResultsProps = {
  places: PlaceResult[];
  onSelectPlace: (place: PlaceResult) => void;
};

// Dropdown under the map search bar listing geocoded places.
export function MapSearchResults({ places, onSelectPlace }: MapSearchResultsProps) {
  return (
    <View style={styles.card}>
      {places.length === 0 ? (
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
  subtitle: {
    paddingHorizontal: Spacing.eleven,
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: MapSearchColors.subtle,
  },
});
