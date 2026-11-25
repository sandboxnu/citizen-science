import { Image } from 'expo-image';
import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from 'react-native';

import { FontFamily, ReportColors, Spacing } from '@/constants/theme';

type EditButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The outlined "✎ Edit" pill used across the report flow. */
export function EditButton({ onPress, accessibilityLabel, disabled, style }: EditButtonProps) {
  return (
    <Pressable
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}>
      <Image source={require('@/assets/images/reportIcons/edit.svg')} style={styles.icon} />
      <Text style={styles.text}>Edit</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.seven,
    paddingVertical: Spacing.two,
    borderWidth: 1,
    borderRadius: 500,
    borderColor: ReportColors.title,
    backgroundColor: ReportColors.surface,
  },
  icon: { width: 13, height: 13 },
  text: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: ReportColors.title,
  },
});
