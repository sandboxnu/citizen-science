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

// Fill + thumb ring color for each level (index 0 = level 1, which has no fill).
const LEVEL_COLORS = [
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
// Before a level is picked, the thumb sits on an extra "not selected" stop at the far left, this far before level 1.
// Once a level is picked that stop goes away and levels 1-5 spread across the whole track.
const UNSET_GAP = Spacing.four;

/** `value` is the severity level (1-5), or null until the user picks one. */
type SeveritySliderProps = { value: number | null; onChange: (value: number) => void };

export function SeveritySlider({ value, onChange }: SeveritySliderProps) {
  const level = value === null ? undefined : SEVERITY_LEVELS[value - 1];
  const isCritical = value === SEVERITY_LEVELS.length;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>How severe is the damage?</Text>
      <SliderTrack value={value} onChange={onChange} />
      {level ? (
        <View style={styles.levelText}>
          <Text style={[styles.levelLabel, isCritical && styles.critical]}>
            Level {value}: {level.label}
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
  const unset = value === null;
  const firstLevelX = THUMB_SIZE / 2 + (unset ? UNSET_GAP : 0);
  const levelSpan = Math.max(width - THUMB_SIZE / 2 - firstLevelX, 0);
  // Center x of each level's stop.
  const centerFor = (level: number) => firstLevelX + ((level - 1) / (levels - 1)) * levelSpan;
  const thumbX = unset ? THUMB_SIZE / 2 : centerFor(value);
  const color = unset ? ReportColors.tileBorder : LEVEL_COLORS[value - 1];

  const select = (next: number) => {
    if (next !== value) onChange(next);
  };

  // Snap to whichever stop is closest to the touch. While unset, staying on the "not selected" stop keeps it unset.
  const setFromX = (x: number) => {
    if (levelSpan === 0) return;
    let nearest: number | null = unset ? null : 1;
    let nearestDistance = unset ? Math.abs(THUMB_SIZE / 2 - x) : Math.abs(centerFor(1) - x);
    for (let level = 1; level <= levels; level++) {
      const distance = Math.abs(centerFor(level) - x);
      if (distance < nearestDistance) {
        nearest = level;
        nearestDistance = distance;
      }
    }
    if (nearest !== null) select(nearest);
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
        now: value ?? 0,
        text: unset ? 'Not selected' : `Level ${value}: ${SEVERITY_LEVELS[value - 1].label}`,
      }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') select(Math.min((value ?? 0) + 1, levels));
        if (e.nativeEvent.actionName === 'decrement' && !unset) select(Math.max(value - 1, 1));
      }}>
      <View style={styles.track} pointerEvents="none" />
      {width > 0 && !unset && value > 1 && (
        <View pointerEvents="none" style={[styles.fill, { width: thumbX + THUMB_SIZE / 2, backgroundColor: color }]} />
      )}
      {width > 0 &&
        Array.from({ length: levels }, (_, i) => i + 1)
          .filter((level) => level !== value)
          .map((level) => (
            <View key={level} pointerEvents="none" style={[styles.dot, { left: centerFor(level) - DOT_SIZE / 2 }]} />
          ))}
      {width > 0 && (
        <View pointerEvents="none" style={[styles.thumb, { left: thumbX - THUMB_SIZE / 2, borderColor: color }]} />
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
