import { Image, type ImageSource } from 'expo-image';
import { useEffect, useRef, type ComponentRef, type ReactNode, type Ref } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { MapOverlayFilters } from '@/components/map-overlay-sheet';
import { FontFamily, MapOverlayColors, Spacing } from '@/constants/theme';
import { DEFAULT_TIMEFRAME, isDefaultTimeframe, timeframeLabel, type Timeframe } from '@/lib/timeframe';

type MapFilterBarProps = {
  filters: MapOverlayFilters;
  timeframe: Timeframe;
  onOpenOverlay: () => void;
  onOpenTimeframe: () => void;
  onChange: (filters: MapOverlayFilters) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  query: string;
  onChangeQuery: (query: string) => void;
  onFocusSearch: () => void;
  onClearQuery: () => void;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
  // Search results dropdown. When present it replaces the chips.
  results?: ReactNode;
};

// Search bar plus the filter chips that float over the top of the map.
export function MapFilterBar({
  filters,
  timeframe,
  onOpenOverlay,
  onOpenTimeframe,
  onChange,
  onTimeframeChange,
  query,
  onChangeQuery,
  onFocusSearch,
  onClearQuery,
  inputRef,
  results,
}: MapFilterBarProps) {
  // The "Map Overlay" chip turns blue whenever any disaster overlay is on.
  const anyActive = Object.values(filters).some(Boolean);
  const timeframeActive = !isDefaultTimeframe(timeframe);

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const scrollToEndPending = useRef(false);
  const tagCount = Number(timeframeActive) + Number(filters.flooding);
  const previousTagCount = useRef(tagCount);
  useEffect(() => {
    if (tagCount > previousTagCount.current) scrollToEndPending.current = true;
    previousTagCount.current = tagCount;
  }, [tagCount]);

  return (
    <View style={[styles.container, results ? styles.containerWithResults : null]}>
      <View style={styles.search}>
        <Image source={require('@/assets/images/mapIcons/search.svg')} style={styles.icon} />
        <TextInput
          ref={inputRef}
          style={styles.searchInput}
          value={query}
          onChangeText={onChangeQuery}
          onFocus={onFocusSearch}
          autoCorrect={false}
          placeholder="Search address or place..."
          placeholderTextColor={MapOverlayColors.searchPlaceholder}
          returnKeyType="search"
          accessibilityLabel="Search"
        />
        {query.length > 0 && (
          <Pressable onPress={onClearQuery} hitSlop={12} accessibilityRole="button" accessibilityLabel="Clear search">
            <Image source={require('@/assets/images/mapIcons/cancel.svg')} style={styles.icon} />
          </Pressable>
        )}
      </View>

      {results ?? (
        <ScrollView
          horizontal
          ref={scrollRef}
          showsHorizontalScrollIndicator={false}
          onContentSizeChange={() => {
            if (!scrollToEndPending.current) return;
            scrollToEndPending.current = false;
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chips}>
          <Chip
            label="Timeframe"
            active={timeframeActive}
            icon={
              timeframeActive
                ? require('@/assets/images/mapIcons/timer-light.svg')
                : require('@/assets/images/mapIcons/timer-dark.svg')
            }
            trailingIcon={
              timeframeActive
                ? require('@/assets/images/mapIcons/chevron-down-light.svg')
                : require('@/assets/images/mapIcons/chevron-down-dark.svg')
            }
            onPress={onOpenTimeframe}
            accessibilityLabel="Open timeframe filter"
          />
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
          {timeframeActive && (
            <Chip
              label={timeframeLabel(timeframe)}
              active
              icon={require('@/assets/images/mapIcons/timer-light.svg')}
              trailingIcon={require('@/assets/images/mapIcons/close.svg')}
              onPress={onOpenTimeframe}
              accessibilityLabel="Open timeframe filter"
              onTrailingPress={() => onTimeframeChange(DEFAULT_TIMEFRAME)}
              trailingAccessibilityLabel="Remove timeframe filter"
            />
          )}
          {filters.flooding && (
            <Chip
              label="Flooding"
              active
              icon={require('@/assets/images/mapIcons/waves.svg')}
              trailingIcon={require('@/assets/images/mapIcons/close.svg')}
              onPress={onOpenOverlay}
              accessibilityLabel="Open map overlay filters"
              onTrailingPress={() => onChange({ ...filters, flooding: false })}
              trailingAccessibilityLabel="Remove flooding overlay"
            />
          )}
        </ScrollView>
      )}
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
  onTrailingPress?: () => void;
  trailingAccessibilityLabel?: string;
};

function Chip({
  label,
  active,
  icon,
  trailingIcon,
  onPress,
  accessibilityLabel,
  onTrailingPress,
  trailingAccessibilityLabel,
}: ChipProps) {
  const chipStyle = [styles.chip, active ? styles.chipActive : styles.chipInactive];
  const content = (
    <>
      <Image source={icon} style={styles.icon} />
      <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>{label}</Text>
    </>
  );

  if (!onTrailingPress) {
    return (
      <Pressable
        style={[...chipStyle, styles.chipPadding]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}>
        {content}
        <Image source={trailingIcon} style={styles.icon} />
      </Pressable>
    );
  }

  return (
    <View style={chipStyle}>
      <Pressable
        style={[styles.chipBody, styles.chipBodyLeading]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}>
        {content}
      </Pressable>
      <Pressable
        style={[styles.chipBody, styles.chipBodyTrailing]}
        onPress={onTrailingPress}
        hitSlop={Spacing.two}
        accessibilityRole="button"
        accessibilityLabel={trailingAccessibilityLabel}>
        <Image source={trailingIcon} style={styles.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  containerWithResults: { gap: Spacing.one },
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
  chipsScroll: { flexGrow: 0, marginHorizontal: -Spacing.five },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: 30,
  },
  chipPadding: { padding: Spacing.ten },
  chipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.ten,
  },
  chipBodyLeading: { paddingLeft: Spacing.ten, paddingRight: Spacing.half },
  chipBodyTrailing: { paddingLeft: Spacing.half, paddingRight: Spacing.ten },
  chipActive: { backgroundColor: MapOverlayColors.chipActive },
  chipInactive: { backgroundColor: MapOverlayColors.chipInactive },
  chipText: { fontFamily: FontFamily.regular, fontSize: 12 },
  chipTextActive: { color: MapOverlayColors.chipActiveText },
  chipTextInactive: { color: MapOverlayColors.chipInactiveText },
});
