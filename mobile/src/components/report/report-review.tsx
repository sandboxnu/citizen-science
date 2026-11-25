import { Image, type ImageSource } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EditButton } from '@/components/report/edit-button';
import {
  type EvidenceDetails,
  formatCoordinates,
  formatTime,
} from '@/components/report/evidence-details-step';
import { SEVERITY_LEVELS } from '@/components/report/severity-slider';
import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

export type ReviewEvidence = {
  value: string;
  title: string;
  icon: ImageSource;
  details: EvidenceDetails;
};

type ReportReviewProps = {
  disasterLabel: string;
  evidence: ReviewEvidence[];
  /** Evidence whose card starts open, e.g. the one just edited. All cards start collapsed otherwise. */
  initiallyExpanded?: string | null;
  submitting: boolean;
  onEdit: (index: number) => void;
  onBack: () => void;
  onSubmit: () => void;
};

const COLUMNS = 3;
const GRID_GAP = Spacing.three;
// With more photos than this, the rest are hidden behind "+N more images".
const COLLAPSED_PHOTO_COUNT = 5;
// Screen padding + card border + card padding, on each side.
const CARD_INSET = Spacing.four + 1 + Spacing.seven;

/** "Report Confirmation": a read-only summary of each piece of evidence before the report is submitted. */
export function ReportReview({
  disasterLabel,
  evidence,
  initiallyExpanded = null,
  submitting,
  onEdit,
  onBack,
  onSubmit,
}: ReportReviewProps) {
  const { width } = useWindowDimensions();
  const tileSize = (width - CARD_INSET * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS;
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set(initiallyExpanded ? [initiallyExpanded] : []),
  );

  const toggle = (value: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">
          Disaster Report
        </Text>

        <View style={styles.body}>
          <View style={styles.intro}>
            <Text style={styles.logTitle}>
              <Text style={styles.logTitleEmphasis}>{disasterLabel}</Text> Report Log
            </Text>
            <Text style={styles.helperText}>Please review the details of your report below.</Text>
          </View>

          {evidence.map((item, index) => (
            <EvidenceCard
              key={item.value}
              item={item}
              tileSize={tileSize}
              expanded={expanded.has(item.value)}
              disabled={submitting}
              onToggle={() => toggle(item.value)}
              onEdit={() => onEdit(index)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={styles.backButton} onPress={onBack} disabled={submitting} accessibilityRole="button">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          style={styles.submitButton}
          onPress={onSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel={submitting ? 'Submitting report' : 'Submit Report'}
          accessibilityState={{ busy: submitting }}>
          {submitting ? (
            <ActivityIndicator color={ReportColors.onPrimary} />
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

type EvidenceCardProps = {
  item: ReviewEvidence;
  tileSize: number;
  expanded: boolean;
  disabled: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

function EvidenceCard({ item, tileSize, expanded, disabled, onToggle, onEdit }: EvidenceCardProps) {
  const { photos, location, observedAt, description, damageRating } = item.details;
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const hiddenCount = Math.max(photos.length - COLLAPSED_PHOTO_COUNT, 0);
  const visiblePhotos = showAllPhotos ? photos : photos.slice(0, COLLAPSED_PHOTO_COUNT);
  const severity = damageRating ? SEVERITY_LEVELS[damageRating - 1] : undefined;
  const trimmedDescription = description.trim();

  return (
    <View style={styles.card}>
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeading}>
            <Image source={item.icon} style={styles.cardIcon} contentFit="contain" tintColor={ReportColors.tileIcon} />
            <View style={styles.cardHeadingText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.photoCount}>
                {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
              </Text>
            </View>
          </View>
          <EditButton
            style={styles.editButton}
            onPress={onEdit}
            disabled={disabled}
            accessibilityLabel={`Edit ${item.title}`}
          />
        </View>

        {expanded && (
          <>
            {photos.length > 0 && (
              <View style={styles.photoSection}>
                <View style={styles.photos}>
                  {visiblePhotos.map((photo) => (
                    <Image
                      key={photo.uri}
                      source={{ uri: photo.uri }}
                      style={[styles.photo, { width: tileSize, height: tileSize }]}
                      contentFit="cover"
                    />
                  ))}
                </View>
                {hiddenCount > 0 && (
                  <Pressable
                    onPress={() => setShowAllPhotos((v) => !v)}
                    hitSlop={Spacing.two}
                    accessibilityRole="button">
                    <Text style={styles.moreLink}>
                      {showAllPhotos
                        ? `Hide ${hiddenCount} ${hiddenCount === 1 ? 'image' : 'images'}`
                        : `+${hiddenCount} more ${hiddenCount === 1 ? 'image' : 'images'}`}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <View style={styles.fields}>
              <View style={styles.fieldRow}>
                <Field label="Location" value={location ? formatCoordinates(location) : null} />
                <Field label="Time" value={observedAt ? formatTime(observedAt) : null} />
              </View>
              <Field label="Description" value={trimmedDescription || null} />
              <Field label="Severity" value={severity ? `Level ${damageRating}: ${severity.label}` : null} />
            </View>
          </>
        )}
      </View>

      <Pressable
        style={styles.toggle}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${item.title}`}
        accessibilityState={{ expanded }}>
        <Text style={styles.toggleText}>{expanded ? 'Hide details' : 'Show details'}</Text>
        <Image
          source={
            expanded
              ? require('@/assets/images/reportIcons/chevron-up-small.svg')
              : require('@/assets/images/reportIcons/chevron-down-small.svg')
          }
          style={styles.toggleChevron}
        />
      </Pressable>
    </View>
  );
}

/** A labelled value; shows "Not indicated" when the user left it empty. */
function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={value === null ? styles.fieldEmpty : styles.fieldValue}>{value ?? 'Not indicated'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ReportColors.surface },
  content: {
    paddingTop: Spacing.five,
    paddingBottom: Spacing.five,
  },
  title: {
    paddingHorizontal: Spacing.four,
    fontFamily: FontFamily.regular,
    fontSize: 24,
    lineHeight: 28.8,
    color: ReportColors.title,
  },
  body: {
    gap: Spacing.five,
    paddingTop: Spacing.four,
    paddingHorizontal: Spacing.four,
  },
  intro: { gap: Spacing.two },
  logTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 20,
    color: ReportColors.textPrimary,
  },
  logTitleEmphasis: { fontFamily: FontFamily.bold, color: ReportColors.modalText },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.chevron,
  },
  card: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.seven,
    gap: Spacing.three,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.cardBorder,
    backgroundColor: ReportColors.surface,
  },
  cardBody: { gap: Spacing.three },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  cardHeading: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardIcon: { width: 25, height: 25 },
  cardHeadingText: { flexShrink: 1, gap: Spacing.one },
  cardTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.tileIcon,
  },
  photoCount: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.chevron,
  },
  editButton: { height: 32 },
  photoSection: { gap: Spacing.seven },
  photos: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  photo: { borderRadius: 8, backgroundColor: ReportColors.surface },
  moreLink: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 14.4,
    color: ReportColors.title,
  },
  fields: { gap: Spacing.three },
  fieldRow: { flexDirection: 'row', gap: Spacing.five },
  field: { flexShrink: 1, gap: Spacing.two },
  fieldLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 14.4,
    color: ReportColors.chevron,
  },
  fieldValue: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.text,
  },
  fieldEmpty: {
    fontFamily: FontFamily.italic,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.chevron,
  },
  // Full card width: cancels the card's horizontal padding so the divider runs edge to edge.
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    marginHorizontal: -Spacing.seven,
    paddingVertical: Spacing.seven,
    borderTopWidth: 1,
    borderTopColor: ReportColors.cardBorder,
  },
  toggleText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.title,
  },
  toggleChevron: { width: 10, height: 5 },
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
  submitButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.ten,
    borderRadius: 8,
    backgroundColor: ReportColors.primaryActive,
  },
  submitText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 20,
    color: ReportColors.onPrimary,
  },
});
