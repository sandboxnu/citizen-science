/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

// Bottom nav bar palette from the SIGHTLINE Figma handoff.
export const NavBarColors = {
  background: '#FFFFFF',
  border: '#E0E1E6',
  foreground: '#054A91',
  selected: '#DCEBFB',
  action: '#BFDCF7',
} as const;

// Flood alert popup palette from the SIGHTLINE Figma handoff.
export const AlertSheetColors = {
  background: '#FFFFFF',
  text: '#1C1B1F',
  textSecondary: '#49454F',
  primary: '#054A91',
  onPrimary: '#FFFFFF',
  handle: '#C4C4C4',
  pill: '#EEEEEE',
  border: '#E6E6E6',
  backdrop: 'rgba(0,0,0,0.35)',
  lastUpdatedDot: '#2F6FDB',
} as const;

// Severity chip colors, keyed by NWS `severity`.
export const SeverityColors: Record<string, { background: string; text: string }> = {
  Extreme: { background: '#B3261E', text: '#FFFFFF' },
  Severe: { background: '#E0672A', text: '#FFFFFF' },
  Moderate: { background: '#F2B13D', text: '#1C1B1F' },
  Minor: { background: '#E0E1E6', text: '#1C1B1F' },
  Unknown: { background: '#E0E1E6', text: '#1C1B1F' },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
  seven: 12,
  eight: 80,
  nine: 45,
  ten: 10
} as const;

export const MaxContentWidth = 800;
