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

type SeveritySliderProps = { value: number; onChange: (value: number) => void };

export function SeveritySlider({ value, onChange }: SeveritySliderProps) {
  const level = SEVERITY_LEVELS[value - 1];
  const isCritical = value === SEVERITY_LEVELS.length;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>How severe is the damage?</Text>
      <SliderTrack value={value} onChange={onChange} />
      <View style={styles.levelText}>
        <Text style={styles.levelLabel}>
          Level {value}: <Text style={isCritical && styles.critical}>{level.label}</Text>
        </Text>
        <Text style={styles.levelDescription}>{level.description}</Text>
      </View>
    </View>
  );
}

function SliderTrack({ value, onChange }: SeveritySliderProps) {
  const [width, setWidth] = useState(0);
  const levels = SEVERITY_LEVELS.length;
  const usable = Math.max(width - THUMB_SIZE, 0);
  // Center x of each level's stop.
  const centerFor = (level: number) => THUMB_SIZE / 2 + ((level - 1) / (levels - 1)) * usable;
  const color = LEVEL_COLORS[value - 1];

  const setFromX = (x: number) => {
    if (usable === 0) return;
    const ratio = Math.min(Math.max((x - THUMB_SIZE / 2) / usable, 0), 1);
    const next = Math.round(ratio * (levels - 1)) + 1;
    if (next !== value) onChange(next);
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
      accessibilityValue={{ min: 1, max: levels, now: value, text: `Level ${value}: ${SEVERITY_LEVELS[value - 1].label}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'increment') onChange(Math.min(value + 1, levels));
        if (e.nativeEvent.actionName === 'decrement') onChange(Math.max(value - 1, 1));
      }}>
      <View style={styles.track} pointerEvents="none" />
      {width > 0 && value > 1 && (
        <View
          pointerEvents="none"
          style={[styles.fill, { width: centerFor(value) + THUMB_SIZE / 2, backgroundColor: color }]}
        />
      )}
      {width > 0 &&
        Array.from({ length: levels }, (_, i) => i + 1)
          .filter((level) => level !== value)
          .map((level) => (
            <View key={level} pointerEvents="none" style={[styles.dot, { left: centerFor(level) - DOT_SIZE / 2 }]} />
          ))}
      {width > 0 && (
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: centerFor(value) - THUMB_SIZE / 2, borderColor: color }]}
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
  levelDescription: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 16.8, color: ReportColors.modalText },
});
