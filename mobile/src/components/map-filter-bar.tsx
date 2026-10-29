import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import type { MapOverlayFilters } from '@/components/map-overlay-sheet';
import { FontFamily, MapOverlayColors, Spacing } from '@/constants/theme';

type MapFilterBarProps = {
  filters: MapOverlayFilters;
  onOpenOverlay: () => void;
  onChange: (filters: MapOverlayFilters) => void;
};

// Search bar plus the filter chips that float over the top of the map.
export function MapFilterBar({ filters, onOpenOverlay, onChange }: MapFilterBarProps) {
  // The "Map Overlay" chip turns blue whenever any disaster overlay is on.
  const anyActive = Object.values(filters).some(Boolean);

  return (
    <View style={styles.container}>
      <View style={styles.search}>
        <Image source={require('@/assets/images/mapIcons/search.svg')} style={styles.icon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search incident, address, or place..."
          placeholderTextColor={MapOverlayColors.searchPlaceholder}
          returnKeyType="search"
          accessibilityLabel="Search"
        />
      </View>

      <View style={styles.chips}>
        <Chip
          label="Map Overlay"
          active={anyActive}
          icon={
            anyActive
              ? require('@/assets/images/mapIcons/layers-light.svg')
              : require('@/assets/images/mapIcons/layers-dark.svg')
          }
          trailingIcon={
            anyActive
              ? require('@/assets/images/mapIcons/chevron-down-light.svg')
              : require('@/assets/images/mapIcons/chevron-down-dark.svg')
          }
          onPress={onOpenOverlay}
          accessibilityLabel="Open map overlay filters"
        />
        {filters.flooding && (
          <Chip
            label="Flooding"
            active
            icon={require('@/assets/images/mapIcons/waves.svg')}
            trailingIcon={require('@/assets/images/mapIcons/close.svg')}
            onPress={() => onChange({ ...filters, flooding: false })}
            accessibilityLabel="Remove flooding overlay"
          />
        )}
      </View>
    </View>
  );
}

type ChipProps = {
  label: string;
  active: boolean;
  icon: ImageSource | number;
  trailingIcon: ImageSource | number;
  onPress: () => void;
  accessibilityLabel: string;
};

function Chip({ label, active, icon, trailingIcon, onPress, accessibilityLabel }: ChipProps) {
  return (
    <Pressable
      style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Image source={icon} style={styles.icon} />
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
      <Image source={trailingIcon} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  search: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.ten,
    borderRadius: 8,
    backgroundColor: MapOverlayColors.searchBackground,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: MapOverlayColors.text,
  },
  icon: { width: 16, height: 16 },
  chips: { flexDirection: 'row', gap: Spacing.two },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.ten,
    borderRadius: 30,
  },
  chipActive: { backgroundColor: MapOverlayColors.chipActive },
  chipInactive: { backgroundColor: MapOverlayColors.chipInactive },
  chipText: { fontFamily: FontFamily.regular, fontSize: 12 },
  chipTextActive: { color: MapOverlayColors.chipActiveText },
  chipTextInactive: { color: MapOverlayColors.chipInactiveText },
});
