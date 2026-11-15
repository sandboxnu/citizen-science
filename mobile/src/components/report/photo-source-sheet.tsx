import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ReportSheet } from '@/components/report/report-sheet';
import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

export type PhotoSource = 'camera' | 'library' | 'previous';

type PhotoSourceSheetProps = {
  visible: boolean;
  /** Photos already added to other evidence in this report. The "Previous uploads" row is hidden when 0. */
  previousCount: number;
  disasterLabel: string;
  onSelect: (source: PhotoSource) => void;
  onClose: () => void;
  onDismiss?: () => void;
};

export function PhotoSourceSheet({
  visible,
  previousCount,
  disasterLabel,
  onSelect,
  onClose,
  onDismiss,
}: PhotoSourceSheetProps) {
  return (
    <ReportSheet visible={visible} onClose={onClose} onDismiss={onDismiss}>
      <View style={styles.options}>
        <SourceRow
          icon={require('@/assets/images/reportIcons/camera.svg')}
          title="Take photo"
          subtitle="Open the camera"
          onPress={() => onSelect('camera')}
        />
        <SourceRow
          icon={require('@/assets/images/reportIcons/image.svg')}
          title="Photo library"
          subtitle="Choose from your device"
          onPress={() => onSelect('library')}
        />
        {previousCount > 0 && (
          <SourceRow
            icon={require('@/assets/images/reportIcons/library-big.svg')}
            title="Previous uploads"
            subtitle={`${previousCount} ${previousCount === 1 ? 'Photo' : 'Photos'} from this ${disasterLabel.toLowerCase()} report`}
            onPress={() => onSelect('previous')}
          />
        )}
      </View>
      <Pressable style={styles.cancel} onPress={onClose} accessibilityRole="button">
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </ReportSheet>
  );
}

type SourceRowProps = { icon: ImageSource; title: string; subtitle: string; onPress: () => void };

function SourceRow({ icon, title, subtitle, onPress }: SourceRowProps) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${title}. ${subtitle}`}>
      <Image source={icon} style={styles.icon} contentFit="contain" />
      <View style={styles.rowText}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  options: {
    alignSelf: 'stretch',
    gap: Spacing.five,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  icon: { width: 24, height: 24 },
  rowText: { gap: Spacing.one },
  title: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 16.8, color: ReportColors.textPrimary },
  subtitle: { fontFamily: FontFamily.regular, fontSize: 12, color: ReportColors.chevron },
  cancel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: Spacing.five,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
    paddingVertical: Spacing.ten,
    borderRadius: 8,
  },
  cancelText: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20, color: ReportColors.chevron },
});
