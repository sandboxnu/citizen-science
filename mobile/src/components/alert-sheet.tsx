import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { AlertSheetColors, SeverityColors, Spacing } from '@/constants/theme';
import { toAlertDetails } from '@/lib/alert-details';
import type { NwsAlert } from '@/lib/nws-alerts';

// Dragging the header down further than this, or flicking it down faster
// than DISMISS_VELOCITY, closes the sheet. Otherwise it springs back.
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 1000;
const MAX_HEIGHT_RATIO = 0.9;

type AlertSheetProps = {
  alert: NwsAlert | null;
  onClose: () => void;
};

// Bottom sheet with an NWS alert's details, shown when its shape is tapped on the map.
export function AlertSheet({ alert, onClose }: AlertSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(windowHeight);

  // Keep rendering the last alert while the sheet animates out.
  const [lastAlert, setLastAlert] = useState(alert);
  if (alert && alert !== lastAlert) setLastAlert(alert);
  const shown = alert ?? lastAlert;

  useEffect(() => {
    if (alert) {
      translateY.set(windowHeight);
      translateY.set(withTiming(0, { duration: 250 }));
    }
  }, [alert, translateY, windowHeight]);

  const close = () => {
    'worklet';
    translateY.set(
      withTiming(windowHeight, { duration: 200 }, (finished) => {
        if (finished) scheduleOnRN(onClose);
      })
    );
  };

  const pan = usePanGesture({
    onUpdate: (event) => {
      translateY.set(Math.max(0, event.translationY));
    },
    onDeactivate: (event) => {
      if (event.translationY > DISMISS_DISTANCE || event.velocityY > DISMISS_VELOCITY) {
        close();
      } else {
        translateY.set(withSpring(0));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.get() }] }));

  if (!shown) return null;
  const details = toAlertDetails(shown);
  const severityColors = SeverityColors[details.severity] ?? SeverityColors.Unknown;

  return (
    <Modal visible={alert !== null} transparent animationType="fade" onRequestClose={close}>
      <GestureHandlerRootView style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close alert" />

        <Animated.View style={[styles.sheet, { maxHeight: windowHeight * MAX_HEIGHT_RATIO }, sheetStyle]}>
          <GestureDetector gesture={pan}>
            <View style={styles.header}>
              <View style={styles.handle} />
              <Text style={styles.title}>{details.title}</Text>

              <View style={styles.chips}>
                <View style={[styles.chip, styles.activeChip]}>
                  <Text style={[styles.chipText, styles.activeChipText]}>Active</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: severityColors.background }]}>
                  <Text style={[styles.chipText, { color: severityColors.text }]}>{details.severity}</Text>
                </View>
              </View>

              {details.lastUpdated ? (
                <View style={styles.lastUpdated}>
                  <View style={styles.dot} />
                  <Text style={styles.secondaryText}>Last Update at {details.lastUpdated}</Text>
                </View>
              ) : null}

              {details.startDate || details.endDate ? (
                <View style={styles.dates}>
                  {details.startDate && <DatePill label="Start Date" value={details.startDate} />}
                  {details.endDate && <DatePill label="End Date" value={details.endDate} />}
                </View>
              ) : null}
            </View>
          </GestureDetector>

          <View style={styles.divider} />

          <ScrollView contentContainerStyle={styles.body}>
            {details.impacts && <Section title="Impacts" text={details.impacts} />}
            {details.instruction && <Section title="Instruction" text={details.instruction} />}
            {details.additionalDetails && <Section title="Additional Details" text={details.additionalDetails} />}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
            <Pressable style={styles.button} onPress={close} accessibilityRole="button">
              <Text style={styles.buttonText}>Understood</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

function DatePill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.pillText}>
        {label}: {value}
      </Text>
    </View>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Image source={require('@/assets/images/alertIcons/radar.svg')} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: AlertSheetColors.backdrop,
  },
  sheet: {
    backgroundColor: AlertSheetColors.background,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: AlertSheetColors.handle,
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: AlertSheetColors.text,
  },
  chips: { flexDirection: 'row', gap: Spacing.one },
  chip: {
    paddingVertical: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.seven + Spacing.half,
    borderRadius: 4,
  },
  activeChip: { backgroundColor: AlertSheetColors.primary },
  chipText: { fontSize: 14, fontWeight: '500' },
  activeChipText: { color: AlertSheetColors.onPrimary },
  lastUpdated: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AlertSheetColors.lastUpdatedDot,
  },
  secondaryText: { fontSize: 13, color: AlertSheetColors.textSecondary },
  dates: { alignItems: 'flex-start', gap: Spacing.two, marginTop: Spacing.three },
  pill: {
    backgroundColor: AlertSheetColors.pill,
    borderRadius: 4,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  pillText: { fontSize: 13, color: AlertSheetColors.text },
  divider: {
    height: 1,
    backgroundColor: AlertSheetColors.border,
    marginHorizontal: Spacing.four,
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  section: {
    borderWidth: 1,
    borderColor: AlertSheetColors.border,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sectionIcon: { width: 22, height: 22 },
  sectionTitle: { fontSize: 18, fontWeight: '500', color: AlertSheetColors.text },
  sectionText: { fontSize: 15, lineHeight: 21, color: AlertSheetColors.text },
  footer: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  button: {
    backgroundColor: AlertSheetColors.primary,
    borderRadius: 8,
    paddingVertical: Spacing.seven,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16, color: AlertSheetColors.onPrimary },
});
