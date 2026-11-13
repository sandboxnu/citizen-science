import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { ReportSheet } from '@/components/report/report-sheet';
import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

const COLUMNS = 3;
const GAP = Spacing.three;

type PreviousUploadsSheetProps<T extends { uri: string }> = {
  visible: boolean;
  photos: T[];
  onAdd: (photos: T[]) => void;
  onClose: () => void;
  onDismiss?: () => void;
};

export function PreviousUploadsSheet<T extends { uri: string }>({
  visible,
  photos,
  onAdd,
  onClose,
  onDismiss,
}: PreviousUploadsSheetProps<T>) {
  const { width, height } = useWindowDimensions();
  const tileSize = (width - Spacing.four * 2 - GAP * (COLUMNS - 1)) / COLUMNS;
  const [selected, setSelected] = useState<string[]>([]);

  // Start each visit with nothing selected.
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setSelected([]);
  }

  const toggle = (uri: string) =>
    setSelected((current) => (current.includes(uri) ? current.filter((u) => u !== uri) : [...current, uri]));

  const canAdd = selected.length > 0;

  return (
    <ReportSheet visible={visible} onClose={onClose} onDismiss={onDismiss}>
      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Add photos
          </Text>
          <Text style={styles.count}>
            {selected.length} {selected.length === 1 ? 'photo' : 'photos'} selected
          </Text>
        </View>

        <ScrollView style={{ maxHeight: height * 0.5 }} contentContainerStyle={styles.grid}>
          {photos.map((photo) => {
            const isSelected = selected.includes(photo.uri);
            return (
              <Pressable
                key={photo.uri}
                style={[styles.tile, { width: tileSize, height: tileSize }, isSelected && styles.tileSelected]}
                onPress={() => toggle(photo.uri)}
                accessibilityRole="checkbox"
                accessibilityLabel="Photo"
                accessibilityState={{ checked: isSelected }}>
                <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                {isSelected ? (
                  <View style={styles.checkBadge}>
                    <Image
                      source={require('@/assets/images/reportIcons/check.svg')}
                      style={styles.checkIcon}
                      contentFit="contain"
                    />
                  </View>
                ) : (
                  <Image
                    source={require('@/assets/images/reportIcons/photo-unselected.svg')}
                    style={styles.unselectedBadge}
                    contentFit="contain"
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[styles.addButton, canAdd ? styles.addEnabled : styles.addDisabled]}
          onPress={() => onAdd(photos.filter((p) => selected.includes(p.uri)))}
          disabled={!canAdd}
          accessibilityRole="button"
          accessibilityState={{ disabled: !canAdd }}>
          <Text style={styles.addText}>Add</Text>
        </Pressable>
      </View>
    </ReportSheet>
  );
}

const styles = StyleSheet.create({
  body: { alignSelf: 'stretch', gap: Spacing.four, paddingHorizontal: Spacing.four },
  header: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 19.2, color: ReportColors.title },
  count: { fontFamily: FontFamily.regular, fontSize: 12, color: ReportColors.chevron },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  tile: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: ReportColors.background },
  tileSelected: { borderWidth: 2, borderColor: ReportColors.primaryLight },
  // Badge sits in the top-right corner, inset 8px horizontally and 12px vertically like the design.
  unselectedBadge: { position: 'absolute', top: 10, right: 6, width: 24, height: 24 },
  checkBadge: {
    position: 'absolute',
    top: Spacing.seven,
    right: Spacing.two,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: ReportColors.photoBadgeBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ReportColors.photoBadge,
  },
  checkIcon: { width: 14, height: 14 },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    marginTop: Spacing.five,
    marginBottom: Spacing.seven,
    paddingHorizontal: Spacing.four,
  },
  cancel: { flex: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  cancelText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 16.8, color: ReportColors.tileBorder },
  addButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.ten,
    borderRadius: 8,
  },
  addEnabled: { backgroundColor: ReportColors.secondaryActive },
  addDisabled: { backgroundColor: ReportColors.tileBorder },
  addText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: ReportColors.onPrimary },
});
