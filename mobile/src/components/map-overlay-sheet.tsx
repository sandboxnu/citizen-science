import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, MapOverlayColors, Spacing } from '@/constants/theme';

export type MapOverlayFilters = {
  flooding: boolean;
};

export const DEFAULT_MAP_OVERLAY_FILTERS: MapOverlayFilters = { flooding: true };

type MapOverlaySheetProps = {
  visible: boolean;
  filters: MapOverlayFilters;
  onSave: (filters: MapOverlayFilters) => void;
  onClose: () => void;
};

export function MapOverlaySheet({ visible, filters, onSave, onClose }: MapOverlaySheetProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close map overlay" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 48) }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Map Overlay</Text>
            <Text style={styles.body}>Customize which disaster boundaries you would like to see on the map.</Text>
          </View>

          <FilterRow
            title="Flooding"
            description="NWS watch areas flooding & predicted flood boundaries"
            value={draft.flooding}
            onChange={(flooding) => setDraft((d) => ({ ...d, flooding }))}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose} accessibilityRole="button">
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={() => onSave(draft)}
              accessibilityRole="button">
              <Text style={[styles.buttonText, styles.saveText]}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FilterRowProps = {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
};

function FilterRow({ title, description, value, onChange }: FilterRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.body}>{description}</Text>
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <Pressable
      style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
      onPress={() => onChange(!value)}
      hitSlop={Spacing.two}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}>
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MapOverlayColors.backdrop,
  },
  sheet: {
    backgroundColor: MapOverlayColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 40,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4.4,
    borderRadius: 2.2,
    backgroundColor: MapOverlayColors.handle,
  },
  header: { gap: Spacing.two },
  title: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    color: MapOverlayColors.title,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * 1.2,
    color: MapOverlayColors.text,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
  rowText: { flex: 1, gap: Spacing.one },
  rowTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 16,
    lineHeight: 16 * 1.2,
    color: MapOverlayColors.title,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleOn: { backgroundColor: MapOverlayColors.toggleOn },
  toggleOff: { backgroundColor: MapOverlayColors.toggleOff },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MapOverlayColors.toggleKnob,
  },
  knobOn: { alignSelf: 'flex-end' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
    borderRadius: 8,
  },
  cancelButton: { backgroundColor: MapOverlayColors.secondary },
  saveButton: { backgroundColor: MapOverlayColors.primary },
  buttonText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  cancelText: { color: MapOverlayColors.onSecondary },
  saveText: { color: MapOverlayColors.onPrimary },
});
