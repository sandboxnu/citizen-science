// Bottom popup for choosing the map's timeframe: a preset (past 7/30/60 days) or a custom date range.
// Keeps a draft of the choice until Save and shows errors for invalid custom dates.

import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TimeframeCalendar } from '@/components/timeframe-calendar';
import { FontFamily, MapOverlayColors, Spacing } from '@/constants/theme';
import {
  formatDateInput,
  maskDateInput,
  parseDateInput,
  PRESET_LABELS,
  startOfDay,
  timeframeLabel,
  type Timeframe,
  type TimeframePreset,
} from '@/lib/timeframe';

type TimeframePopupProps = {
  visible: boolean;
  timeframe: Timeframe;
  onSave: (timeframe: Timeframe) => void;
  onClose: () => void;
};

type Draft = { kind: Timeframe['kind']; startText: string; endText: string };
type DateField = 'start' | 'end';
type DateError = {
  field: DateField;
  message: string;
  // Rules about a complete, parsed date show right away; the empty/partial ones wait
  // until the field is left or Save is pressed so typing isn't flagged mid-entry.
  immediate: boolean;
};

const PRESETS: TimeframePreset[] = ['past7', 'past30', 'past60'];

const toDraft = (timeframe: Timeframe): Draft =>
  timeframe.kind === 'custom'
    ? { kind: 'custom', startText: formatDateInput(timeframe.start), endText: formatDateInput(timeframe.end) }
    : { kind: timeframe.kind, startText: '', endText: formatDateInput(new Date()) };

function validateCustomRange(draft: Draft, start: Date | null, end: Date | null): DateError | null {
  if (!start) {
    const message = draft.startText ? 'Please enter a valid start date.' : 'Please enter a start date.';
    return { field: 'start', message, immediate: false };
  }
  if (!end) {
    const message = draft.endText ? 'Please enter a valid end date.' : 'Please enter an end date.';
    return { field: 'end', message, immediate: false };
  }
  if (end > startOfDay(new Date())) {
    return { field: 'end', message: 'End date cannot be in the future. Please select another date.', immediate: true };
  }
  if (start > end) {
    return { field: 'start', message: 'Start date cannot be after the end date.', immediate: true };
  }
  return null;
}

export function TimeframePopup({ visible, timeframe, onSave, onClose }: TimeframePopupProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(() => toDraft(timeframe));
  const [expanded, setExpanded] = useState(timeframe.kind === 'custom');
  const [activeField, setActiveField] = useState<DateField>('start');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<DateField, boolean>>({ start: false, end: false });

  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) {
      setDraft(toDraft(timeframe));
      setExpanded(timeframe.kind === 'custom');
      setActiveField('start');
      setSubmitted(false);
      setTouched({ start: false, end: false });
    }
  }

  const start = parseDateInput(draft.startText);
  const end = parseDateInput(draft.endText);
  const error = draft.kind === 'custom' ? validateCustomRange(draft, start, end) : null;
  const visibleError = error && (error.immediate || submitted || touched[error.field]) ? error : null;

  const draftTimeframe: Timeframe | null =
    draft.kind === 'custom'
      ? start && end && !error
        ? { kind: 'custom', start, end }
        : null
      : { kind: draft.kind };

  const selectedLabel =
    draft.kind === 'custom'
      ? draftTimeframe
        ? timeframeLabel(draftTimeframe)
        : 'Custom Range'
      : PRESET_LABELS[draft.kind];

  const handleSave = () => {
    if (draftTimeframe) {
      onSave(draftTimeframe);
    } else {
      setSubmitted(true);
    }
  };

  const setText = (field: DateField, text: string) =>
    setDraft((d) => ({ ...d, [field === 'start' ? 'startText' : 'endText']: maskDateInput(text) }));

  // Tapping a calendar day fills the active field, then moves on to the end date.
  const selectDay = (date: Date) => {
    setText(activeField, formatDateInput(date));
    if (activeField === 'start') setActiveField('end');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close timeframe" />

        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 48) }]}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Image source={require('@/assets/images/mapIcons/timer-title.svg')} style={styles.titleIcon} />
                <Text style={styles.title}>Timeframe</Text>
              </View>
              <Text style={styles.body}>Choose which events appear on the map. Boundaries update to match.</Text>
            </View>

            <View style={styles.section}>
              <Pressable
                style={styles.sectionHeader}
                onPress={() => setExpanded((e) => !e)}
                accessibilityRole="button"
                accessibilityState={{ expanded }}
                accessibilityLabel="Show events from">
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>Show events from</Text>
                  {!expanded && (
                    <Text style={styles.sectionValue}>
                      {selectedLabel}
                      {draft.kind === 'past30' && ' (default)'}
                    </Text>
                  )}
                </View>
                <View style={expanded ? styles.chevronUp : styles.chevronDown}>
                  <Image source={require('@/assets/images/mapIcons/chevron-section.svg')} style={styles.chevron} />
                </View>
              </Pressable>

              {expanded && (
                <View style={styles.options}>
                  {PRESETS.map((preset) => (
                    <RadioRow
                      key={preset}
                      label={PRESET_LABELS[preset]}
                      hint={preset === 'past30' ? '(default)' : undefined}
                      selected={draft.kind === preset}
                      onPress={() => setDraft((d) => ({ ...d, kind: preset }))}
                    />
                  ))}
                  <RadioRow
                    label="Custom Range"
                    selected={draft.kind === 'custom'}
                    onPress={() => {
                      setDraft((d) => ({ ...d, kind: 'custom' }));
                      setActiveField('start');
                    }}
                  />

                  {draft.kind === 'custom' && (
                    <View style={styles.custom}>
                      <View style={styles.dates}>
                        <DateInput
                          value={draft.startText}
                          placeholder="MM/DD/YYYY"
                          focused={activeField === 'start'}
                          error={visibleError?.field === 'start'}
                          onFocus={() => setActiveField('start')}
                          onBlur={() => setTouched((t) => ({ ...t, start: true }))}
                          onChange={(text) => setText('start', text)}
                          label="Start date"
                        />
                        <Text style={styles.to}>to</Text>
                        <DateInput
                          value={draft.endText}
                          placeholder="MM/DD/YYYY"
                          focused={activeField === 'end'}
                          error={visibleError?.field === 'end'}
                          onFocus={() => setActiveField('end')}
                          onBlur={() => setTouched((t) => ({ ...t, end: true }))}
                          onChange={(text) => setText('end', text)}
                          label="End date"
                        />
                      </View>
                      {visibleError && (
                        <Text style={styles.error} accessibilityRole="alert">
                          {visibleError.message}
                        </Text>
                      )}
                      <TimeframeCalendar
                        start={start && startOfDay(start)}
                        end={end && startOfDay(end)}
                        initialMonth={end ?? new Date()}
                        onSelect={selectDay}
                      />
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onClose} accessibilityRole="button">
              <Text style={[styles.buttonText, styles.cancelText]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              accessibilityRole="button">
              <Text style={[styles.buttonText, styles.saveText]}>Save</Text>
            </Pressable>
          </View>
        </View>
        </KeyboardAvoidingView>
    </Modal>
  );
}

type RadioRowProps = { label: string; hint?: string; selected: boolean; onPress: () => void };

function RadioRow({ label, hint, selected, onPress }: RadioRowProps) {
  return (
    <Pressable
      style={styles.radioRow}
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}>
      <Image
        source={
          selected
            ? require('@/assets/images/mapIcons/radio-on.svg')
            : require('@/assets/images/mapIcons/radio-off.svg')
        }
        style={styles.radio}
      />
      <Text style={[styles.radioText, selected && styles.radioTextSelected]}>
        {label}
        {hint && <Text style={styles.hint}> {hint}</Text>}
      </Text>
    </Pressable>
  );
}

type DateInputProps = {
  value: string;
  placeholder: string;
  focused: boolean;
  error: boolean;
  label: string;
  onFocus: () => void;
  onBlur: () => void;
  onChange: (text: string) => void;
};

function DateInput({ value, placeholder, focused, error, label, onFocus, onBlur, onChange }: DateInputProps) {
  return (
    <TextInput
      style={[styles.dateInput, focused && styles.dateInputFocused, error && styles.dateInputError]}
      value={value}
      placeholder={placeholder}
      placeholderTextColor={error ? MapOverlayColors.error : MapOverlayColors.searchPlaceholder}
      keyboardType="number-pad"
      onFocus={onFocus}
      onBlur={onBlur}
      onChangeText={onChange}
      accessibilityLabel={label}
    />
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MapOverlayColors.backdrop,
  },
  sheet: {
    maxHeight: '90%',
    backgroundColor: MapOverlayColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 40,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  handle: {
    position: 'absolute',
    top: 40,
    alignSelf: 'center',
    width: 44,
    height: 4.4,
    borderRadius: 2.2,
    backgroundColor: MapOverlayColors.handle,
  },
  scroll: { flexGrow: 0, marginTop: Spacing.four + 4.4 },
  content: { gap: Spacing.four },
  header: { gap: Spacing.two },
  titleRow: { flexDirection: 'row', gap: Spacing.one },
  titleIcon: { width: 24, height: 24 },
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
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', gap: Spacing.one },
  sectionText: { flex: 1, gap: Spacing.two },
  sectionTitle: {
    fontFamily: FontFamily.regular,
    fontSize: 16,
    lineHeight: 16 * 1.2,
    color: MapOverlayColors.inputText,
  },
  sectionValue: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * 1.2,
    color: MapOverlayColors.subtle,
  },
  chevron: { width: 24, height: 24 },
  // Fixed size and top alignment so rotating doesn't swing the icon out of place
  // when the collapsed row stretches to two lines of text.
  chevronDown: { width: 24, height: 24, alignSelf: 'flex-start', transform: [{ rotate: '90deg' }] },
  chevronUp: { width: 24, height: 24, alignSelf: 'flex-start', transform: [{ rotate: '-90deg' }] },
  options: { gap: Spacing.two },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  radio: { width: 20, height: 20 },
  radioText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * 1.2,
    color: MapOverlayColors.bodySubtle,
  },
  radioTextSelected: { color: MapOverlayColors.inputText },
  hint: { color: MapOverlayColors.subtle },
  custom: { gap: Spacing.two },
  dates: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  to: { fontFamily: FontFamily.regular, fontSize: 14, color: MapOverlayColors.title },
  dateInput: {
    flex: 1,
    height: 40,
    padding: Spacing.ten,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: MapOverlayColors.searchPlaceholder,
    backgroundColor: MapOverlayColors.searchBackground,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: MapOverlayColors.title,
  },
  dateInputFocused: { borderWidth: 1, borderColor: MapOverlayColors.primary },
  dateInputError: { borderWidth: 1, borderColor: MapOverlayColors.error },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 14 * 1.2,
    color: MapOverlayColors.error,
  },
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
