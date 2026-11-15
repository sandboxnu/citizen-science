import { Image } from 'expo-image';
import { Pressable } from 'react-native';

import { ReportColors, Spacing } from '@/constants/theme';

export function CloseReportButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={Spacing.two}
      accessibilityRole="button"
      accessibilityLabel="Close report">
      <Image
        source={require('@/assets/images/reportIcons/close.svg')}
        style={{ width: 24, height: 24 }}
        contentFit="contain"
        tintColor={ReportColors.title}
      />
    </Pressable>
  );
}
