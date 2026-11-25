import { useState } from 'react';
import { type LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

export const SEVERITY_LEVELS = [
  { label: 'Low', description: 'Little or no damage. Nothing needs to be done.' },
  { label: 'Minor', description: 'Small or limited damage. Easy to fix or clean up.' },
  { label: 'Moderate', description: 'Noticeable damage. Still usable but needs repair.' },
  { label: 'High', description: 'Serious damage. Unsafe or unusable until it’s fixed.' },
  { label: 'Critical', description: 'Severe damage. Immediate danger or risk to life.' },
] as const;

const POSITION_COLORS = [
  ReportColors.tileBorder,
  ReportColors.tileBorder,
  ReportColors.secondaryContainer,
  ReportColors.secondary,
  ReportColors.primary,
  ReportColors.primaryActive,
] as const;

const THUMB_SIZE = 20;
const THUMB_BORDER = 5;
const DOT_SIZE = 8;
const TRACK_HEIGHT = 12;
const UNSET_GAP = Spacing.four;

type SeveritySliderProps = { value: number | null; onChange: (value: number | null) => void };

export function SeveritySlider({ value, onChange }: SeveritySliderProps) {
  const level = value === null ? undefined : SEVERITY_LEVELS[value - 1];
  const isCritical = value === SEVERITY_LEVELS.length;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>How severe is the damage?</Text>
      <SliderTrack value={value} onChange={onChange} />
      {level ? (
        <View style={styles.levelText}>
          <Text style={styles.levelLabel}>
            Level {value}: <Text style={isCritical && styles.critical}>{level.label}</Text>
          </Text>
          <Text style={styles.levelDescription}>{level.description}</Text>
        </View>
      ) : (
        <Text style={styles.unsetText}>Slide the dot to select severity</Text>
      )}
    </View>
  );
}

function SliderTrack({ value, onChange }: SeveritySliderProps) {
  const [width, setWidth] = useState(0);
  const levels = SEVERITY_LEVELS.length;
  // Stop 0 is "not selected"; stops 1-5 are the levels.
  const position = value ?? 0;
  const firstLevelX = THUMB_SIZE / 2 + UNSET_GAP;
  const levelSpan = Math.max(width - THUMB_SIZE / 2 - firstLevelX, 0);
  // Center x of each stop.
  const centerFor = (stop: number) =>
    stop === 0 ? THUMB_SIZE / 2 : firstLevelX + ((stop - 1) / (levels - 1)) * levelSpan;
  const color = POSITION_COLORS[position];

  const setPosition = (next: number) => {
    if (next !== position) onChange(next === 0 ? null : next);
  };

  // Snap to whichever stop is closest to the touch.
  const setFromX = (x: number) => {
    if (levelSpan === 0) return;
    let nearest = 0;
    for (let stop = 1; stop <= levels; stop++) {
      if (Math.abs(centerFor(stop) - x) < Math.abs(centerFor(nearest) - x)) nearest = stop;
    }
    setPosition(nearest);
  };

  return (
    <View
      style={styles.slider}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => setFromX(e.nativeEvent.locationX)}
      onResponderMove={(e) => setFromX(e.nativeEvent.locationX)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Damage severity"
      accessibilityValue={{
        min: 0,
        max: levels,
        now: position,
        text: value === null ? 'Not selected' : `Level ${value}: ${SEVERITY_LEVELS[value - 1].label}`,
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') setPosition(Math.min(position + 1, levels));
        if (e.nativeEvent.actionName === 'decrement') setPosition(Math.max(position - 1, 0));
      }}>
      <View style={styles.track} pointerEvents="none" />
      {width > 0 && position > 0 && (
        <View
          pointerEvents="none"
          style={[styles.fill, { width: centerFor(position) + THUMB_SIZE / 2, backgroundColor: color }]}
        />
      )}
      {width > 0 &&
        Array.from({ length: levels + 1 }, (_, stop) => stop)
          .filter((stop) => stop !== position)
          .map((stop) => (
            <View key={stop} pointerEvents="none" style={[styles.dot, { left: centerFor(stop) - DOT_SIZE / 2 }]} />
          ))}
      {width > 0 && (
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: centerFor(position) - THUMB_SIZE / 2, borderColor: color }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 15, paddingHorizontal: Spacing.four },
  question: { fontFamily: FontFamily.medium, fontSize: 16, lineHeight: 19.2, color: ReportColors.textPrimary },
  slider: { height: THUMB_SIZE + Spacing.two, justifyContent: 'center' },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: TRACK_HEIGHT,
    borderRadius: Spacing.eleven,
    backgroundColor: ReportColors.sliderTrack,
  },
  fill: { position: 'absolute', left: 0, height: TRACK_HEIGHT, borderRadius: 500 },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: ReportColors.surface,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    borderWidth: THUMB_BORDER,
    backgroundColor: ReportColors.surface,
  },
  levelText: { gap: Spacing.two },
  levelLabel: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 16.8, color: ReportColors.textPrimary },
  critical: { color: ReportColors.required },
  unsetText: { fontFamily: FontFamily.italic, fontSize: 14, lineHeight: 16.8, color: ReportColors.text },
  levelDescription: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 16.8, color: ReportColors.modalText },
});
