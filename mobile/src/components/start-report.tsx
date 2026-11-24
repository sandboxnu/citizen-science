import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { FontFamily, Spacing, StartReportColors } from '@/constants/theme';


type StartReportProps = {
  onOpen: () => void;
};

export function StartReport({ onOpen }: StartReportProps) {
    return (
        <View style={styles.container} pointerEvents="box-none">
            <Pressable style={[styles.button]} accessibilityRole="button" onPress={onOpen}>
                <Image source={require('@/assets/images/reportIcons/start-report.svg')} style={styles.icon} />
                <Text style={[styles.buttonText]}>Start Report</Text>
            </Pressable>
        </View>
    );
}   

const styles = StyleSheet.create({
  // Floats over the map instead of taking its own row below it.
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Spacing.four,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.eleven,
    paddingVertical: Spacing.three,
    borderRadius: 44,
    backgroundColor: StartReportColors.background,
  },
  icon: { width: 24, height: 24 },
  buttonText: {
    fontFamily: FontFamily.medium,
    fontSize: 16,
    lineHeight: 16 * 1.2,
    color: StartReportColors.text,
  },
});
