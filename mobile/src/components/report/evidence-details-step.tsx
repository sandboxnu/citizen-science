import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { SymbolView } from 'expo-symbols';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CloseReportButton } from '@/components/report/close-report-button';
import { EditLocationModal } from '@/components/report/edit-location-modal';
import { EditTimeModal } from '@/components/report/edit-time-modal';
import { type PhotoSource, PhotoSourceSheet } from '@/components/report/photo-source-sheet';
import { PreviousUploadsSheet } from '@/components/report/previous-uploads-sheet';
import { SeveritySlider } from '@/components/report/severity-slider';
import { FontFamily, ReportColors, Spacing } from '@/constants/theme';
import { type Coordinates, getPhotoCoordinates, getPhotoTakenAt } from '@/lib/photo-metadata';

export type ReportPhoto = Coordinates & {
  uri: string;
  /** Whether the coordinates came from the photo's GPS data (otherwise the device location at upload). */
  hasPhotoLocation: boolean;
  takenAt: Date | null;
};

/** Where a location or time value came from, shown as a tag next to its label. */
export type ValueSource = 'photo' | 'current' | 'edited';

export type EvidenceDetails = {
  photos: ReportPhoto[];
  location: Coordinates | null;
  locationSource: ValueSource;
  observedAt: Date | null;
  observedAtSource: ValueSource;
  description: string;
  damageRating: number; // 1-5
};

export const emptyEvidenceDetails = (): EvidenceDetails => ({
  photos: [],
  location: null,
  locationSource: 'photo',
  observedAt: null,
  observedAtSource: 'photo',
  description: '',
  damageRating: 1,
});

export const isEvidenceDetailsComplete = (details: EvidenceDetails) =>
  details.photos.length > 0 && details.location !== null && details.observedAt !== null;

const MAX_PHOTOS = 20;
const MAX_DESCRIPTION_LENGTH = 500;
const COLUMNS = 3;
const GRID_GAP = Spacing.three;
// Collapsed, the grid shows two rows: the upload tile plus this many photos.
const COLLAPSED_PHOTO_COUNT = COLUMNS * 2 - 1;

type Sheet = 'source' | 'previous' | 'location' | 'time' | null;

type EvidenceDetailsStepProps = {
  title: string;
  disasterLabel: string;
  step: number;
  totalSteps: number;
  details: EvidenceDetails;
  /** Photos added to the report's other evidence, offered as "Previous uploads". */
  previousPhotos: ReportPhoto[];
  submitting?: boolean;
  onChange: (details: EvidenceDetails) => void;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
};

export function EvidenceDetailsStep({
  title,
  disasterLabel,
  step,
  totalSteps,
  details,
  previousPhotos,
  submitting = false,
  onChange,
  onBack,
  onNext,
  onClose,
}: EvidenceDetailsStepProps) {
  const { width } = useWindowDimensions();
  const tileSize = (width - Spacing.four * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;

  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [sheet, setSheet] = useState<Sheet>(null);
  // iOS can't present a picker or another modal until the current one has finished dismissing.
  const afterDismiss = useRef<(() => void) | null>(null);

  const canContinue = isEvidenceDetailsComplete(details) && !loadingPhotos && !submitting;
  const remaining = MAX_PHOTOS - details.photos.length;
  const availablePrevious = previousPhotos.filter((p) => !details.photos.some((own) => own.uri === p.uri));

  const closeSheetThen = (next: () => void) => {
    setSheet(null);
    if (Platform.OS === 'ios') afterDismiss.current = next;
    else next();
  };

  const handleSheetDismiss = () => {
    const next = afterDismiss.current;
    afterDismiss.current = null;
    next?.();
  };

  const addPhotos = async (incoming: ReportPhoto[]) => {
    const photos = incoming.slice(0, remaining);
    if (photos.length === 0) return;
    // Location and time come from the first photo, unless already set or edited.
    const first = photos[0];
    onChange({
      ...details,
      photos: [...details.photos, ...photos],
      ...(details.location === null && {
        location: { latitude: first.latitude, longitude: first.longitude },
        locationSource: first.hasPhotoLocation ? 'photo' : 'current',
      }),
      ...(details.observedAt === null && {
        observedAt: first.takenAt ?? new Date(),
        observedAtSource: first.takenAt ? 'photo' : 'current',
      }),
    });
  };

  const addPickerAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setLoadingPhotos(true);
    try {
      // Photos without GPS data fall back to wherever the device is now.
      let deviceCoords: Coordinates | null | undefined;
      const getDeviceCoords = async () => {
        if (deviceCoords === undefined) deviceCoords = await getCurrentCoordinates();
        return deviceCoords;
      };

      const photos: ReportPhoto[] = [];
      for (const asset of assets) {
        const photoCoords = getPhotoCoordinates(asset);
        const coords = photoCoords ?? (await getDeviceCoords());
        if (coords) {
          photos.push({
            uri: asset.uri,
            ...coords,
            hasPhotoLocation: photoCoords !== null,
            takenAt: getPhotoTakenAt(asset),
          });
        }
      }
      if (photos.length < assets.length) {
        Alert.alert(
          'Location needed',
          'Some photos have no location data. Turn on location access so we can tag them with where you are.',
        );
      }
      await addPhotos(photos);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to take photos for your report.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      exif: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) await addPickerAssets(result.assets);
  };

  const pickFromLibrary = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      exif: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) await addPickerAssets(result.assets);
  };

  const handleSource = (source: PhotoSource) => {
    if (source === 'camera') closeSheetThen(takePhoto);
    else if (source === 'library') closeSheetThen(pickFromLibrary);
    else closeSheetThen(() => setSheet('previous'));
  };

  const removePhoto = (uri: string) => {
    const photos = details.photos.filter((photo) => photo.uri !== uri);
    // Location and time come from the photos, so clear them once none are left.
    onChange(photos.length > 0 ? { ...details, photos } : { ...details, photos, location: null, observedAt: null });
  };

  const showUploadTile = details.photos.length < MAX_PHOTOS;
  const collapsedCount = showUploadTile ? COLLAPSED_PHOTO_COUNT : COLLAPSED_PHOTO_COUNT + 1;
  const hiddenCount = Math.max(details.photos.length - collapsedCount, 0);
  const visiblePhotos = showAllPhotos ? details.photos : details.photos.slice(0, collapsedCount);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Text style={styles.title} accessibilityRole="header">
              Disaster Report
            </Text>
            <CloseReportButton onPress={onClose} disabled={submitting} />
          </View>
          <Text style={styles.requiredNote}>*Required</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.photoSection}>
            <View style={styles.evidenceHeader}>
              <View style={styles.evidenceTitleRow}>
                <Text style={styles.evidenceTitle}>{title}</Text>
                <Text style={styles.stepCount}>
                  {step} of {totalSteps}
                </Text>
              </View>
              <Text style={styles.helperText}>
                Please upload photos of what you see.
                <Text style={styles.requiredMark}>*</Text>
              </Text>
            </View>

            <View style={styles.photos}>
              {showUploadTile && (
                <Pressable
                  style={[styles.tile, styles.uploadTile, { width: tileSize, height: tileSize }]}
                  onPress={() => setSheet('source')}
                  disabled={loadingPhotos}
                  accessibilityRole="button"
                  accessibilityLabel="Upload photos">
                  {loadingPhotos ? (
                    <ActivityIndicator color={ReportColors.chevron} />
                  ) : (
                    <Image source={require('@/assets/images/reportIcons/upload.svg')} style={styles.uploadIcon} />
                  )}
                </Pressable>
              )}
              {visiblePhotos.map((photo) => (
                <View key={photo.uri} style={[styles.tile, { width: tileSize, height: tileSize }]}>
                  <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <Pressable
                    style={styles.removePhoto}
                    onPress={() => removePhoto(photo.uri)}
                    hitSlop={Spacing.two}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo">
                    <SymbolView name={{ ios: 'xmark', android: 'close', web: 'close' }} size={10} tintColor="#FFFFFF" />
                  </Pressable>
                </View>
              ))}
            </View>

            {hiddenCount > 0 && (
              <Pressable onPress={() => setShowAllPhotos((v) => !v)} hitSlop={Spacing.two} accessibilityRole="button">
                <Text style={styles.moreLink}>
                  {showAllPhotos
                    ? `Hide ${hiddenCount} ${hiddenCount === 1 ? 'image' : 'images'}`
                    : `+${hiddenCount} more ${hiddenCount === 1 ? 'image' : 'images'}`}
                </Text>
              </Pressable>
            )}
          </View>

          <EditableField
            label="Location"
            source={details.locationSource}
            value={details.location ? formatCoordinates(details.location) : null}
            onEdit={() => setSheet('location')}
          />

          <EditableField
            label="Time"
            source={details.observedAtSource}
            value={details.observedAt ? formatTime(details.observedAt) : null}
            onEdit={() => setSheet('time')}
          />

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              value={details.description}
              onChangeText={(description) => onChange({ ...details, description })}
              placeholder={`Describe the ${title.toLowerCase()} (optional)`}
              placeholderTextColor={ReportColors.chevron}
              maxLength={MAX_DESCRIPTION_LENGTH}
              multiline
              accessibilityLabel="Description"
            />
          </View>
        </View>

        <SeveritySlider
          value={details.damageRating}
          onChange={(damageRating) => onChange({ ...details, damageRating })}
        />
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.backButton} onPress={onBack} disabled={submitting} accessibilityRole="button">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={[styles.nextButton, canContinue ? styles.nextEnabled : styles.nextDisabled]}
          onPress={onNext}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityLabel={submitting ? 'Submitting report' : 'Next'}
          accessibilityState={{ disabled: !canContinue, busy: submitting }}>
          {submitting ? (
            <ActivityIndicator color={ReportColors.onPrimary} />
          ) : (
            <Text style={styles.nextText}>Next</Text>
          )}
        </Pressable>
      </View>

      <PhotoSourceSheet
        visible={sheet === 'source'}
        previousCount={availablePrevious.length}
        disasterLabel={disasterLabel}
        onSelect={handleSource}
        onClose={() => setSheet(null)}
        onDismiss={handleSheetDismiss}
      />

      <PreviousUploadsSheet
        visible={sheet === 'previous'}
        photos={availablePrevious}
        onAdd={(photos) => {
          setSheet(null);
          addPhotos(photos);
        }}
        onClose={() => setSheet(null)}
      />

      {details.location && (
        <EditLocationModal
          visible={sheet === 'location'}
          location={details.location}
          onSave={(location) => {
            setSheet(null);
            onChange({ ...details, location, locationSource: 'edited' });
          }}
          onClose={() => setSheet(null)}
        />
      )}

      {details.observedAt && (
        <EditTimeModal
          visible={sheet === 'time'}
          value={details.observedAt}
          onSave={(observedAt) => {
            setSheet(null);
            onChange({ ...details, observedAt, observedAtSource: 'edited' });
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </SafeAreaView>
  );
}

const SOURCE_TAGS: Record<'Location' | 'Time', Record<ValueSource, string>> = {
  Location: {
    photo: 'From photo',
    current: 'Current location',
    edited: 'Edited',
  },
  Time: { photo: 'From photo', current: 'Current time', edited: 'Edited' },
};

type EditableFieldProps = {
  label: 'Location' | 'Time';
  source: ValueSource;
  /** null until a photo has been uploaded. */
  value: string | null;
  onEdit: () => void;
};

function EditableField({ label, source, value, onEdit }: EditableFieldProps) {
  const edited = source === 'edited';
  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>
          {label}
          <Text style={styles.requiredMark}>*</Text>
        </Text>
        {value !== null && (
          <View style={styles.sourceTag}>
            <View style={[styles.sourceDot, edited && styles.sourceDotEdited]} />
            <Text style={[styles.sourceText, edited && styles.sourceTextEdited]}>{SOURCE_TAGS[label][source]}</Text>
          </View>
        )}
      </View>
      {value === null ? (
        <Text style={styles.placeholderText}>Please upload a photo first.</Text>
      ) : (
        <View style={styles.valueRow}>
          <Text style={styles.fieldValue}>{value}</Text>
          <Pressable
            style={styles.editButton}
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${label.toLowerCase()}`}>
            <Image source={require('@/assets/images/reportIcons/edit.svg')} style={styles.editIcon} />
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

async function getCurrentCoordinates(): Promise<Coordinates | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

const formatCoordinates = ({ latitude, longitude }: Coordinates) => `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ReportColors.background },
  content: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.five,
  },
  header: { gap: Spacing.two, paddingHorizontal: Spacing.four },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 24,
    lineHeight: 28.8,
    color: ReportColors.title,
  },
  requiredNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.required,
  },
  requiredMark: { color: ReportColors.required },
  body: { gap: Spacing.five, paddingHorizontal: Spacing.four },
  photoSection: { gap: Spacing.three },
  evidenceHeader: { gap: Spacing.two },
  evidenceTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  evidenceTitle: {
    flexShrink: 1,
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    color: ReportColors.modalText,
  },
  stepCount: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.chevron,
  },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.chevron,
  },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: ReportColors.background,
  },
  uploadTile: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: ReportColors.tileBorder,
  },
  uploadIcon: { width: 32, height: 32 },
  removePhoto: {
    position: 'absolute',
    top: Spacing.one,
    right: Spacing.one,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ReportColors.photoBadge,
  },
  moreLink: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.primaryLight,
  },
  field: { gap: Spacing.two },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.seven,
  },
  fieldLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.title,
  },
  sourceTag: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  sourceDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ReportColors.primaryLight,
  },
  sourceDotEdited: { backgroundColor: ReportColors.required },
  sourceText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.text,
  },
  sourceTextEdited: { color: ReportColors.required },
  placeholderText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.chevron,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  fieldValue: {
    flexShrink: 1,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 19.2,
    color: ReportColors.modalText,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: 500,
    borderColor: ReportColors.title,
    backgroundColor: ReportColors.surface,
  },
  editIcon: { width: 13, height: 13 },
  editText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.title,
  },
  input: {
    minHeight: 37,
    paddingHorizontal: Spacing.seven,
    paddingTop: Spacing.seven,
    paddingBottom: Spacing.two,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: ReportColors.tileBorder,
    backgroundColor: ReportColors.surface,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.modalText,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
  },
  backButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.four,
  },
  backText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.textPrimary,
  },
  nextButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
    borderRadius: 8,
  },
  nextEnabled: { backgroundColor: ReportColors.primaryActive },
  nextDisabled: { backgroundColor: ReportColors.tileBorder },
  nextText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: ReportColors.onPrimary,
  },
});
