import { Image, type ImageSource } from 'expo-image';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { FontFamily, NavBarColors, Spacing } from '@/constants/theme';

type TabBarButtonProps = Omit<TabTriggerSlotProps, 'ref'> & {
  label: string;
  icon: ImageSource | number;
  // The center "+" action renders as a label-less circle instead of an icon + label.
  variant?: 'default' | 'action';
};

export function TabBarButton({
  label,
  icon,
  variant = 'default',
  isFocused,
  ...props
}: TabBarButtonProps) {
  const isAction = variant === 'action';

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}>
      {isAction ? (
        <View style={styles.actionCircle}>
          <Image source={icon} style={styles.icon} />
        </View>
      ) : (
        <View style={[styles.item, isFocused && styles.itemFocused]}>
          <Image source={icon} style={styles.icon} />
          <Text style={styles.label}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
  item: {
    alignItems: 'center',
    gap: Spacing.one,
    minWidth: 64,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.two,
    borderRadius: 8,
  },
  itemFocused: {
    backgroundColor: NavBarColors.selected,
  },
  label: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: NavBarColors.foreground,
  },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NavBarColors.action,
  },
});
