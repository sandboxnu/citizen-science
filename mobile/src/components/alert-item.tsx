import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AlertItemColors, FontFamily } from '@/constants/theme';

export type AlertItemType = 'flood' | 'boundary';

type AlertItemProps = {
  type: AlertItemType;
  read?: boolean;
  startDate: string;
  endDate: string;
  title?: string;
  message?: string;
  onPress?: () => void;
};

const VARIANTS = {
  flood: {
    icon: require('@/assets/images/alertIcons/waves-horizontal.svg'),
    title: 'Disaster warning',
    message: '',
    messageColor: AlertItemColors.floodMessage,
  },
  boundary: {
    icon: require('@/assets/images/alertIcons/map-pin.svg'),
    title: 'Location detected near boundary',
    message: 'You are located near a flood boundary.\nSee damage? Start a report now.',
    messageColor: AlertItemColors.boundaryMessage,
  },
} as const;

export function AlertItem({ type, read = false, startDate, endDate, title, message, onPress }: AlertItemProps) {
  const variant = VARIANTS[type];
  const start = new Date(startDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const end = new Date(endDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const suppliedTitle = title?.trim();
  const suppliedMessage = message?.trim();
  const displayTitle = suppliedTitle || variant.title;
  const displayMessage = suppliedMessage || (type === 'flood'
    ? `NWS issued a flooding alert from ${start} to ${end}`
    : variant.message);


  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, !read && styles.unread]}>
      <View style={styles.iconBox}>
        <Image source={variant.icon} style={styles.icon} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          <Text style={styles.timestamp}>{formatTimestamp(startDate)}</Text>
        </View>
        <Text style={[styles.message, { color: variant.messageColor }]}>{displayMessage}</Text>
      </View>
    </Pressable>
  );
}

function formatTimestamp(startDate: string): string {
  const start = new Date(startDate).getTime();
  const now = Date.now();
  const diff = now - start;

  if (!Number.isFinite(start) || diff < 0) {
    return new Date(startDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (diff === 0) {
    return 'just now';
  }

  if (diff < 60 * 1000) {
    return `${Math.floor(diff / 1000)}s ago`;
  }

  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 1000))}m ago`;
  }

  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  }

  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  }

  return new Date(startDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingLeft: 20,
    paddingRight: 24,
    paddingVertical: 16,
    backgroundColor: AlertItemColors.background,
    borderBottomWidth: 1,
    borderBottomColor: AlertItemColors.border,
  },
  unread: { backgroundColor: AlertItemColors.unreadBackground },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: AlertItemColors.iconBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { width: 24, height: 24 },
  content: { flex: 1, gap: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flexShrink: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 17,
    color: AlertItemColors.title,
  },
  timestamp: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: AlertItemColors.timestamp,
  },
  message: {
    maxWidth: 251,
    fontFamily: FontFamily.regular,
    fontSize: 12,
  },
});
