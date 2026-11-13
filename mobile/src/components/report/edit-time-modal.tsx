import { Image } from 'expo-image';
import { type ComponentRef, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

const ROW_HEIGHT = 24;
const ROW_GAP = 8;
const PITCH = ROW_HEIGHT + ROW_GAP;
const VISIBLE_ROWS = 5;
const PADDING_ROWS = Math.floor(VISIBLE_ROWS / 2);
const WHEEL_HEIGHT = VISIBLE_ROWS * PITCH - ROW_GAP;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const MERIDIEMS = ['AM', 'PM'];

type TimeParts = { hour: number; minute: number; pm: boolean }; // hour is 1-12

const toParts = (date: Date): TimeParts => {
  const h = date.getHours();
  return { hour: h % 12 === 0 ? 12 : h % 12, minute: date.getMinutes(), pm: h >= 12 };
};

const applyParts = (date: Date, { hour, minute, pm }: TimeParts) => {
  const next = new Date(date);
  // Seconds aren't editable, so a manually edited time is exact to the minute.
  next.setHours((hour % 12) + (pm ? 12 : 0), minute, 0, 0);
  return next;
};

type EditTimeModalProps = {
  visible: boolean;
  value: Date;
  onSave: (value: Date) => void;
  onClose: () => void;
};

export function EditTimeModal({ visible, value, onSave, onClose }: EditTimeModalProps) {
  const [parts, setParts] = useState(() => toParts(value));

  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setParts(toParts(value));
  }

  const initial = toParts(value);
  const changed = parts.hour !== initial.hour || parts.minute !== initial.minute || parts.pm !== initial.pm;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.top}>
            <Pressable onPress={onClose} hitSlop={Spacing.two} accessibilityRole="button" accessibilityLabel="Close">
              <Image source={require('@/assets/images/reportIcons/close.svg')} style={styles.close} />
            </Pressable>
            <Text style={styles.title} accessibilityRole="header">
              Edit Time
            </Text>
          </View>

          {visible && (
            <View style={styles.wheels}>
              <View style={styles.highlight} pointerEvents="none" />
              <View style={styles.columns}>
                <WheelColumn
                  label="Hour"
                  items={HOURS}
                  index={parts.hour - 1}
                  onChange={(i) => setParts((p) => ({ ...p, hour: i + 1 }))}
                />
                <WheelColumn
                  label="Minute"
                  items={MINUTES}
                  index={parts.minute}
                  onChange={(i) => setParts((p) => ({ ...p, minute: i }))}
                />
                <WheelColumn
                  label="AM or PM"
                  items={MERIDIEMS}
                  index={parts.pm ? 1 : 0}
                  onChange={(i) => setParts((p) => ({ ...p, pm: i === 1 }))}
                />
              </View>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, changed ? styles.saveEnabled : styles.saveDisabled]}
              onPress={() => onSave(applyParts(value, parts))}
              disabled={!changed}
              accessibilityRole="button"
              accessibilityState={{ disabled: !changed }}>
              <Text style={[styles.buttonText, styles.saveText]}>Save changes</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type WheelColumnProps = { label: string; items: string[]; index: number; onChange: (index: number) => void };

function WheelColumn({ label, items, index, onChange }: WheelColumnProps) {
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // The row currently under the highlight while scrolling, used to fade the rows around it.
  const [centered, setCentered] = useState(index);

  const indexFor = (e: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(Math.max(Math.round(e.nativeEvent.contentOffset.y / PITCH), 0), items.length - 1);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = indexFor(e);
    if (next !== centered) setCentered(next);
  };

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = indexFor(e);
    setCentered(next);
    if (next !== index) onChange(next);
  };

  const step = (delta: number) => {
    const next = Math.min(Math.max(index + delta, 0), items.length - 1);
    scrollRef.current?.scrollTo({ y: next * PITCH, animated: true });
    setCentered(next);
    onChange(next);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.wheel}
      contentContainerStyle={styles.wheelContent}
      showsVerticalScrollIndicator={false}
      snapToInterval={PITCH}
      decelerationRate="fast"
      scrollEventThrottle={16}
      onLayout={() => scrollRef.current?.scrollTo({ y: index * PITCH, animated: false })}
      onScroll={handleScroll}
      onMomentumScrollEnd={commit}
      onScrollEndDrag={(e) => {
        // Without momentum, onMomentumScrollEnd never fires.
        if (!e.nativeEvent.velocity || Math.abs(e.nativeEvent.velocity.y) < 0.05) commit(e);
      }}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: items[index] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      {items.map((item, i) => (
        <View key={item} style={styles.row}>
          <Text style={[styles.rowText, Math.abs(i - centered) >= PADDING_ROWS && styles.rowFaded]}>{item}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 25, backgroundColor: ReportColors.sheetOverlay },
  card: {
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.eleven,
    borderRadius: 8,
    backgroundColor: ReportColors.surface,
  },
  top: { alignItems: 'flex-end' },
  close: { width: 24, height: 24 },
  title: { alignSelf: 'stretch', fontFamily: FontFamily.medium, fontSize: 20, lineHeight: 24, color: ReportColors.modalText },
  wheels: { height: WHEEL_HEIGHT, justifyContent: 'center' },
  highlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: PADDING_ROWS * PITCH - 4,
    height: 31,
    borderRadius: 8,
    backgroundColor: ReportColors.secondaryContainer,
  },
  columns: { flexDirection: 'row', gap: Spacing.five, marginLeft: 40, height: WHEEL_HEIGHT },
  wheel: { width: 33, flexGrow: 0 },
  wheelContent: { paddingVertical: PADDING_ROWS * PITCH, gap: ROW_GAP },
  row: { height: ROW_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontFamily: FontFamily.regular, fontSize: 20, lineHeight: 24, color: ReportColors.modalText },
  rowFaded: { opacity: 0.3 },
  actions: { flexDirection: 'row', gap: Spacing.two, height: 40 },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.ten,
    paddingHorizontal: Spacing.four,
    borderRadius: 8,
  },
  buttonText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  cancelText: { color: ReportColors.chevron },
  saveEnabled: { backgroundColor: ReportColors.primaryActive },
  saveDisabled: { backgroundColor: ReportColors.tileBorder },
  saveText: { color: ReportColors.surface },
});
