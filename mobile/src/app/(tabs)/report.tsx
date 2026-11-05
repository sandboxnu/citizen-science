import { Image, type ImageSource } from 'expo-image';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { type ComponentRef, useMemo, useRef, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

type DisasterType = 'flooding';

const DISASTER_TYPES: {
  value: DisasterType;
  label: string;
  icon: ImageSource;
}[] = [
  {
    value: 'flooding',
    label: 'Flooding',
    icon: require('@/assets/images/reportIcons/waves.svg'),
  },
];

type EvidenceOption = {
  value: string;
  title: string;
  description: string;
  icon: ImageSource;
};

// Evidence the user typed in themselves is stored with this prefix so it can't collide with a built-in value.
// When the report is submitted it maps to the `other` concern type, with the title as `otherDescription`.
const CUSTOM_EVIDENCE_PREFIX = 'custom:';
const MAX_CUSTOM_EVIDENCE_LENGTH = 100;

const isCustomEvidence = (value: string) => value.startsWith(CUSTOM_EVIDENCE_PREFIX);

// Evidence of damage the user can report, per disaster type.
const EVIDENCE_OPTIONS: Record<DisasterType, EvidenceOption[]> = {
  flooding: [
    {
      value: 'high-waterline',
      title: 'High Waterline',
      description: 'Marks on walls or trees showing how high water rose.',
      icon: require('@/assets/images/reportIcons/waves.svg'),
    },
    {
      value: 'standing-water',
      title: 'Standing Water',
      description: 'Water pooling in streets, yards, or fields that isn’t draining.',
      icon: require('@/assets/images/reportIcons/cloud-rain.svg'),
    },
    {
      value: 'impassable-roadway',
      title: 'Impassable Roadway',
      description: 'Roads blocked or unsafe to cross because of floodwater, mud, or debris.',
      icon: require('@/assets/images/reportIcons/cone.svg'),
    },
    {
      value: 'building-water-damage',
      title: 'Building Water Damage',
      description: 'Water around or inside a building structure that has left damage behind.',
      icon: require('@/assets/images/reportIcons/building-complex.svg'),
    },
    {
      value: 'infrastructure-damage',
      title: 'Infrastructure Damage',
      description: 'Roads, bridges, culverts, pipes, wells, or septic systems damaged or collapsed.',
      icon: require('@/assets/images/reportIcons/road.svg'),
    },
    {
      value: 'crop-damage',
      title: 'Crop Damage',
      description: 'Flooded fields, or plants and crops that are damaged or washed out.',
      icon: require('@/assets/images/reportIcons/sprout.svg'),
    },
    {
      value: 'power-utility-damage',
      title: 'Power or Utility Damage',
      description: 'Downed lines, flooded electrical equipment, or damaged utilities.',
      icon: require('@/assets/images/reportIcons/zap-off.svg'),
    },
    {
      value: 'submerged-vehicle',
      title: 'Submerged Vehicle',
      description: 'Car partially or fully underwater or stranded.',
      icon: require('@/assets/images/reportIcons/car.svg'),
    },
  ],
};

export default function ReportScreen() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(true);
  const [typeExpanded, setTypeExpanded] = useState(true);
  const [disasterType, setDisasterType] = useState<DisasterType | null>(null);

  const [evidence, setEvidence] = useState<string[]>([]);
  const [evidenceQuery, setEvidenceQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const canContinue = disasterType !== null && evidence.length > 0;
  // Show the options list until something is picked; after that, only while searching.
  const showEvidenceOptions = evidence.length === 0 || searchFocused;
  const selectedType = DISASTER_TYPES.find((type) => type.value === disasterType);

  const evidenceOptions = useMemo(() => {
    if (!disasterType) return [];
    const query = evidenceQuery.trim().toLowerCase();
    const options = EVIDENCE_OPTIONS[disasterType].filter((option) => !evidence.includes(option.value));
    if (!query) return options;
    return options.filter(
      (option) => option.title.toLowerCase().includes(query) || option.description.toLowerCase().includes(query),
    );
  }, [disasterType, evidenceQuery, evidence]);

  const selectedEvidence = disasterType
    ? evidence.flatMap((value) => {
        if (isCustomEvidence(value)) return [{ value, title: value.slice(CUSTOM_EVIDENCE_PREFIX.length) }];
        const option = EVIDENCE_OPTIONS[disasterType].find((o) => o.value === value);
        return option ? [{ value, title: option.title }] : [];
      })
    : [];

  // Offer to add the search text as new evidence when nothing matches it.
  const trimmedQuery = evidenceQuery.trim().slice(0, MAX_CUSTOM_EVIDENCE_LENGTH);
  const alreadySelected = selectedEvidence.some((e) => e.title.toLowerCase() === trimmedQuery.toLowerCase());
  const canAddCustomEvidence = trimmedQuery !== '' && evidenceOptions.length === 0 && !alreadySelected;

  const handleSelectType = (type: DisasterType) => {
    // Evidence depends on the disaster type, so selecting or unselecting clears it.
    setEvidence([]);
    setEvidenceQuery('');

    // Tapping the selected tile again unselects it and returns to the initial state.
    const unselecting = type === disasterType;
    setDisasterType(unselecting ? null : type);
    setTypeExpanded(unselecting);
  };

  const toggleEvidence = (value: string) => {
    setEvidence((current) => (current.includes(value) ? current.filter((v) => v !== value) : [...current, value]));
    // Picking an option closes the search so the list collapses.
    setEvidenceQuery('');
    searchInputRef.current?.blur();
  };

  const addCustomEvidence = () => {
    setEvidence((current) => [...current, `${CUSTOM_EVIDENCE_PREFIX}${trimmedQuery}`]);
    setEvidenceQuery('');
    searchInputRef.current?.blur();
  };

  const removeEvidence = (value: string) => {
    setEvidence((current) => current.filter((v) => v !== value));
  };

  const hasProgress = disasterType !== null || evidence.length > 0;

  // Confirm before throwing away a report the user has started.
  const handleCancel = () => {
    if (hasProgress) setShowDeleteModal(true);
  };

  const handleDeleteReport = () => {
    setShowDeleteModal(false);
    setDisasterType(null);
    setTypeExpanded(true);
    setEvidence([]);
    setEvidenceQuery('');
    router.navigate('/');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Disaster Evidence Report</Text>
          <Text style={styles.requiredNote}>*Required</Text>
        </View>

        {showWarning && <WarningBanner onDismiss={() => setShowWarning(false)} />}

        {selectedType && !typeExpanded ? (
          <Pressable
            style={[styles.card, styles.summaryCard]}
            onPress={() => setTypeExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`Disaster type, ${selectedType.label}. Tap to change.`}
            accessibilityState={{ expanded: false }}>
            <Image source={selectedType.icon} style={styles.icon} contentFit="contain" tintColor={ReportColors.title} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>
                Disaster type<Text style={styles.requiredMark}>*</Text>
              </Text>
              <Text style={styles.summaryValue}>{selectedType.label}</Text>
            </View>
            <SymbolView
              name={{
                ios: 'chevron.down',
                android: 'keyboard_arrow_down',
                web: 'keyboard_arrow_down',
              }}
              size={18}
              tintColor={ReportColors.chevron}
            />
          </Pressable>
        ) : (
          <View style={styles.card}>
            <Pressable
              style={styles.cardHeader}
              onPress={() => setTypeExpanded((v) => !v)}
              accessibilityRole="button"
              accessibilityState={{ expanded: typeExpanded }}>
              <Text style={styles.question}>
                What type of <Text style={styles.questionEmphasis}>disaster</Text> are you reporting?
                <Text style={styles.requiredMark}>*</Text>
              </Text>
              <SymbolView
                name={{
                  ios: 'chevron.up',
                  android: 'keyboard_arrow_up',
                  web: 'keyboard_arrow_up',
                }}
                size={18}
                tintColor={ReportColors.chevron}
                style={!typeExpanded && styles.chevronCollapsed}
              />
            </Pressable>

            {typeExpanded && (
              <View style={styles.tiles}>
                {DISASTER_TYPES.map((type) => (
                  <DisasterTile
                    key={type.value}
                    label={type.label}
                    icon={type.icon}
                    selected={disasterType === type.value}
                    onPress={() => handleSelectType(type.value)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {disasterType && (
          <View style={styles.evidenceSection}>
            <Text style={styles.sectionTitle}>Your evidence</Text>

            {selectedEvidence.length > 0 && (
              <View style={styles.selectedEvidenceList}>
                {selectedEvidence.map((option) => (
                  <SelectedEvidenceCard
                    key={option.value}
                    title={option.title}
                    onRemove={() => removeEvidence(option.value)}
                  />
                ))}
              </View>
            )}

            <View style={styles.evidenceIntro}>
              <Text style={styles.question}>
                What <Text style={styles.questionEmphasis}>evidence of damage</Text> do you see?
                <Text style={styles.requiredMark}>*</Text>
              </Text>
              <Text style={styles.helperText}>Select all that apply. You’ll add photos and details for each one.</Text>
            </View>

            <View style={styles.search}>
              <SymbolView
                name={{
                  ios: 'magnifyingglass',
                  android: 'search',
                  web: 'search',
                }}
                size={18}
                tintColor={ReportColors.text}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                maxLength={MAX_CUSTOM_EVIDENCE_LENGTH}
                value={evidenceQuery}
                onChangeText={setEvidenceQuery}
                returnKeyType="search"
                autoCorrect={false}
                accessibilityLabel="Search evidence of damage"
              />
            </View>

            {showEvidenceOptions && (
              <View>
                {evidenceOptions.map((option, index) => (
                  <EvidenceRow
                    key={option.value}
                    option={option}
                    selected={evidence.includes(option.value)}
                    showDivider={index < evidenceOptions.length - 1}
                    onPress={() => toggleEvidence(option.value)}
                  />
                ))}
                {canAddCustomEvidence && <AddEvidenceRow title={trimmedQuery} onPress={addCustomEvidence} />}
                {alreadySelected && evidenceOptions.length === 0 && (
                  <Text style={styles.emptyText}>“{trimmedQuery}” is already in your evidence.</Text>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.actions}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={handleCancel} accessibilityRole="button">
          <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.button, canContinue ? styles.nextButton : styles.nextButtonDisabled]}
          disabled={!canContinue}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}>
          <Text style={[styles.buttonText, canContinue ? styles.nextText : styles.nextTextDisabled]}>Next</Text>
        </Pressable>
      </View>

      <DeleteReportModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onDelete={handleDeleteReport}
      />
    </SafeAreaView>
  );
}

type DeleteReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onDelete: () => void;
};

function DeleteReportModal({ visible, onClose, onDelete }: DeleteReportModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.modalCard} accessibilityViewIsModal>
          <Pressable
            style={styles.modalClose}
            onPress={onClose}
            hitSlop={Spacing.two}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={20}
              tintColor={ReportColors.modalText}
            />
          </Pressable>

          <View style={styles.modalTitleRow}>
            <SymbolView
              name={{ ios: 'trash', android: 'delete', web: 'delete' }}
              size={22}
              tintColor={ReportColors.destructive}
            />
            <Text style={styles.modalTitle} accessibilityRole="header">
              Delete this report?
            </Text>
          </View>
          <Text style={styles.modalBody}>
            Your evidence selections and any photos you added will be deleted. This can’t be undone.
          </Text>

          <View style={styles.modalActions}>
            <Pressable style={[styles.button, styles.modalButton]} onPress={onClose} accessibilityRole="button">
              <Text style={[styles.buttonText, styles.modalCancelText]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.modalButton, styles.deleteButton]}
              onPress={onDelete}
              accessibilityRole="button">
              <Text style={[styles.buttonText, styles.deleteText]}>Delete report</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function WarningBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <View style={styles.warning}>
      <View style={styles.warningBody}>
        <View style={styles.warningTitleRow}>
          <SymbolView
            name={{
              ios: 'exclamationmark.triangle',
              android: 'warning',
              web: 'warning',
            }}
            size={20}
            tintColor={ReportColors.warningText}
          />
          <Text style={styles.warningTitle}>Warning</Text>
        </View>
        <Text style={styles.warningText}>
          In the event of an emergency,{' '}
          <Text style={styles.warningLink} onPress={() => Linking.openURL('tel:911')} accessibilityRole="link">
            dial 911.
          </Text>
        </Text>
      </View>
      <Pressable
        onPress={onDismiss}
        hitSlop={Spacing.two}
        accessibilityRole="button"
        accessibilityLabel="Dismiss warning">
        <SymbolView
          name={{ ios: 'xmark', android: 'close', web: 'close' }}
          size={20}
          tintColor={ReportColors.warningText}
        />
      </Pressable>
    </View>
  );
}

function SelectedEvidenceCard({ title, onRemove }: { title: string; onRemove: () => void }) {
  return (
    <View style={styles.selectedEvidenceCard}>
      <Text style={styles.selectedEvidenceTitle}>{title}</Text>
      <Pressable
        onPress={onRemove}
        hitSlop={Spacing.two}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${title}`}>
        <SymbolView
          name={{ ios: 'trash', android: 'delete', web: 'delete' }}
          size={20}
          tintColor={ReportColors.tileSelectedText}
        />
      </Pressable>
    </View>
  );
}

type EvidenceRowProps = {
  option: EvidenceOption;
  selected: boolean;
  showDivider: boolean;
  onPress: () => void;
};

function EvidenceRow({ option, selected, showDivider, onPress }: EvidenceRowProps) {
  return (
    <Pressable
      style={[styles.evidenceRow, showDivider && styles.evidenceDivider, selected && styles.evidenceRowSelected]}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={`${option.title}. ${option.description}`}
      accessibilityState={{ checked: selected }}>
      <View style={styles.evidenceText}>
        <Text style={[styles.evidenceTitle, selected && styles.evidenceTitleSelected]}>{option.title}</Text>
        <Text style={styles.evidenceDescription}>{option.description}</Text>
      </View>
      <Image
        source={option.icon}
        style={styles.icon}
        contentFit="contain"
        tintColor={selected ? ReportColors.tileSelectedText : ReportColors.text}
      />
    </Pressable>
  );
}

function AddEvidenceRow({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      style={[styles.evidenceRow, styles.evidenceDivider]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Add ${title} as evidence`}>
      <Text style={[styles.evidenceText, styles.addEvidenceText]}>Add “{title}”</Text>
      <SymbolView
        name={{ ios: 'plus', android: 'add', web: 'add' }}
        size={20}
        tintColor={ReportColors.tileSelectedText}
      />
    </Pressable>
  );
}

type DisasterTileProps = {
  label: string;
  icon: ImageSource;
  selected: boolean;
  onPress: () => void;
};

function DisasterTile({ label, icon, selected, onPress }: DisasterTileProps) {
  return (
    <Pressable
      style={[styles.tile, selected && styles.tileSelected]}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}>
      <Image
        source={icon}
        style={styles.icon}
        contentFit="contain"
        tintColor={selected ? ReportColors.tileSelectedText : ReportColors.tileIcon}
      />
      <Text style={[styles.tileText, selected && styles.tileTextSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ReportColors.background },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.four,
    gap: Spacing.four,
  },
  header: { gap: Spacing.two },
  title: {
    fontFamily: FontFamily.regular,
    fontSize: 24,
    color: ReportColors.title,
  },
  requiredNote: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.required,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.seven,
    marginBottom: Spacing.two, // + content gap (24) = 32 between warning and card
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.warningBorder,
    backgroundColor: ReportColors.warningBackground,
  },
  warningBody: { flex: 1, gap: Spacing.one },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  warningTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: ReportColors.warningText,
  },
  warningText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.warningText,
  },
  warningLink: { textDecorationLine: 'underline', fontSize: 14 },
  card: {
    padding: Spacing.eleven,
    gap: Spacing.eleven,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.cardBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  question: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.text,
  },
  questionEmphasis: { fontFamily: FontFamily.bold },
  requiredMark: { color: ReportColors.required },
  icon: { width: 36, height: 36 },
  chevronCollapsed: { transform: [{ rotate: '180deg' }] },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.seven },
  tile: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.tileBorder,
  },
  tileSelected: {
    borderColor: ReportColors.tileSelectedBorder,
    backgroundColor: ReportColors.tileSelectedBackground,
  },
  tileText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ReportColors.tileText,
  },
  tileTextSelected: { color: ReportColors.tileSelectedText },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  summaryText: { flex: 1, gap: Spacing.one },
  summaryLabel: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: ReportColors.text,
  },
  summaryValue: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ReportColors.tileText,
  },
  evidenceSection: { gap: Spacing.three },
  sectionTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: ReportColors.title,
  },
  selectedEvidenceList: { gap: Spacing.two, marginBottom: Spacing.three },
  selectedEvidenceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.eleven,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.tileBorder,
  },
  selectedEvidenceTitle: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 16,
    color: ReportColors.tileSelectedText,
  },
  evidenceIntro: { gap: Spacing.two },
  helperText: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.text,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.seven,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: ReportColors.tileBorder,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ReportColors.text,
  },
  evidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.seven,
  },
  evidenceDivider: {
    borderBottomWidth: 1,
    borderBottomColor: ReportColors.cardBorder,
  },
  evidenceRowSelected: { backgroundColor: ReportColors.tileSelectedBackground },
  evidenceText: { flex: 1, gap: Spacing.one },
  evidenceTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ReportColors.text,
  },
  evidenceTitleSelected: { color: ReportColors.tileSelectedText },
  evidenceDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 16.8,
    color: ReportColors.tileText,
  },
  addEvidenceText: { fontFamily: FontFamily.regular, fontSize: 16, color: ReportColors.tileSelectedText },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: ReportColors.tileText,
    paddingVertical: Spacing.three,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.seven,
    borderRadius: 8,
  },
  cancelButton: { flex: 0.7 },
  nextButton: { backgroundColor: ReportColors.primary },
  nextButtonDisabled: { backgroundColor: ReportColors.disabled },
  buttonText: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 22 },
  cancelText: { color: ReportColors.cancelText },
  nextText: { color: ReportColors.onPrimary },
  nextTextDisabled: { color: ReportColors.onDisabled },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    backgroundColor: ReportColors.overlay,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: Spacing.eleven,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.eleven,
    gap: Spacing.two,
    borderRadius: 8,
    backgroundColor: ReportColors.background,
  },
  modalClose: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.seven,
  },
  modalTitle: {
    fontFamily: FontFamily.semiBold,
    fontSize: 20,
    color: ReportColors.modalText,
  },
  modalBody: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 19.6,
    color: ReportColors.modalText,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  modalButton: { flex: 1 },
  modalCancelText: { color: ReportColors.modalText },
  deleteButton: { backgroundColor: ReportColors.destructive },
  deleteText: { color: ReportColors.onPrimary },
});
