import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';
import type { Coordinates } from '@/lib/photo-metadata';

const MAP_DELTA = 0.01;
const COORD_DECIMALS = 6;

type EditLocationModalProps = {
  visible: boolean;
  location: Coordinates;
  onSave: (location: Coordinates) => void;
  onClose: () => void;
};

const parseCoord = (text: string, limit: number) => {
  if (!/^\s*-?\d+(\.\d+)?\s*$/.test(text)) return null;
  const value = Number(text);
  return Math.abs(value) <= limit ? value : null;
};

export function EditLocationModal({ visible, location, onSave, onClose }: EditLocationModalProps) {
  const mapRef = useRef<MapView>(null);
  const [latText, setLatText] = useState('');
  const [lngText, setLngText] = useState('');

  // Reset the fields to the current location each time the modal opens.
  const [wasVisible, setWasVisible] = useState(false);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setLatText(location.latitude.toFixed(COORD_DECIMALS));
      setLngText(location.longitude.toFixed(COORD_DECIMALS));
    }
  }

  const latitude = parseCoord(latText, 90);
  const longitude = parseCoord(lngText, 180);
  const draft = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const changed =
    draft !== null &&
    (draft.latitude.toFixed(COORD_DECIMALS) !== location.latitude.toFixed(COORD_DECIMALS) ||
      draft.longitude.toFixed(COORD_DECIMALS) !== location.longitude.toFixed(COORD_DECIMALS));
  const pin = draft ?? location;

  const moveMap = (coords: Coordinates) =>
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: MAP_DELTA, longitudeDelta: MAP_DELTA }, 250);

  const setFromMap = (coords: Coordinates) => {
    setLatText(coords.latitude.toFixed(COORD_DECIMALS));
    setLngText(coords.longitude.toFixed(COORD_DECIMALS));
  };

  const commitTyped = () => {
    if (draft) moveMap(draft);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}>
          <View style={styles.card} accessibilityViewIsModal>
            <View style={styles.top}>
              <Pressable onPress={onClose} hitSlop={Spacing.two} accessibilityRole="button" accessibilityLabel="Close">
                <Image source={require('@/assets/images/reportIcons/close.svg')} style={styles.close} />
              </Pressable>
              <View style={styles.fields}>
                <Text style={styles.title} accessibilityRole="header">
                  Edit Location
                </Text>
                <CoordField label="Latitude" value={latText} onChangeText={setLatText} onBlur={commitTyped} />
                <CoordField label="Longitude" value={lngText} onChangeText={setLngText} onBlur={commitTyped} />
              </View>
            </View>

            <View style={styles.mapWrap}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={{ ...location, latitudeDelta: MAP_DELTA, longitudeDelta: MAP_DELTA }}
                onPress={(e) => setFromMap(e.nativeEvent.coordinate)}>
                <Marker
                  coordinate={pin}
                  anchor={{ x: 0.5, y: 0.92 }}
                  draggable
                  onDragEnd={(e) => setFromMap(e.nativeEvent.coordinate)}>
                  <Image source={require('@/assets/images/reportIcons/location-pin.svg')} style={styles.pin} />
                </Marker>
              </MapView>
            </View>

            <View style={styles.actions}>
              <Pressable style={styles.button} onPress={onClose} accessibilityRole="button">
                <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.button, changed ? styles.saveEnabled : styles.saveDisabled]}
                onPress={() => draft && onSave(draft)}
                disabled={!changed}
                accessibilityRole="button"
                accessibilityState={{ disabled: !changed }}>
                <Text style={[styles.buttonText, styles.saveText]}>Save changes</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type CoordFieldProps = { label: string; value: string; onChangeText: (text: string) => void; onBlur: () => void };

function CoordField({ label, value, onChangeText, onBlur }: CoordFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onSubmitEditing={onBlur}
        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        returnKeyType="done"
        autoCorrect={false}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: ReportColors.sheetOverlay },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.twelve, paddingVertical: Spacing.four },
  card: {
    alignItems: 'flex-end',
    gap: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    paddingHorizontal: Spacing.eleven,
    borderRadius: 8,
    backgroundColor: ReportColors.surface,
  },
  top: { alignSelf: 'stretch', alignItems: 'flex-end' },
  close: { width: 24, height: 24 },
  fields: { alignSelf: 'stretch', gap: Spacing.three },
  title: { fontFamily: FontFamily.medium, fontSize: 20, lineHeight: 24, color: ReportColors.modalText },
  field: { gap: Spacing.two },
  fieldLabel: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 16.8, color: ReportColors.title },
  input: {
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.two,
    paddingHorizontal: Spacing.seven,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: ReportColors.tileBorder,
    backgroundColor: ReportColors.surface,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.modalText,
  },
  mapWrap: { alignSelf: 'stretch', height: 247, borderRadius: 4, overflow: 'hidden' },
  pin: { width: 42, height: 42 },
  actions: { alignSelf: 'stretch', flexDirection: 'row', gap: Spacing.two },
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
  saveText: { color: ReportColors.onPrimary },
});
