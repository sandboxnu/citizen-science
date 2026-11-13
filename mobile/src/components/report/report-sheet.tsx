import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportColors, Spacing } from '@/constants/theme';

type ReportSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** iOS only: fires once the sheet has fully closed, so another modal or picker can be presented. */
  onDismiss?: () => void;
  children: ReactNode;
};

// Bottom sheet with a drag handle, used by the evidence details step.
export function ReportSheet({ visible, onClose, onDismiss, children }: ReportSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onDismiss={onDismiss}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]} accessibilityViewIsModal>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: ReportColors.sheetOverlay },
  sheet: {
    alignItems: 'center',
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    backgroundColor: ReportColors.surface,
  },
  handleArea: { width: 64, paddingHorizontal: Spacing.ten, paddingVertical: Spacing.four },
  handle: { height: 4.4, borderRadius: 2.2, backgroundColor: ReportColors.sheetHandle },
});
