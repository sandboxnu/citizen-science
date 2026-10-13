import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export const AUTH_PRIMARY = '#054A91';

type AuthSheetProps = {
  heading: string;
  headingSize?: number;
  // Minimum fraction of the screen height the white sheet takes up; it grows to fit its content.
  sheetRatio?: number;
  children: ReactNode;
};

// Blue hero with the wordmark and a white rounded sheet holding the form.
export function AuthSheet({
  heading,
  headingSize = 20,
  sheetRatio = 0.67,
  children,
}: AuthSheetProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Text style={styles.wordmark}>sightline</Text>
      </View>

      <View style={[styles.sheet, { minHeight: `${sheetRatio * 100}%` }]}>
        <View style={styles.form}>
          <Text style={[styles.heading, { fontSize: headingSize }]}>{heading}</Text>
          {children}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_PRIMARY },
  hero: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.eight,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  form: {
    paddingTop: Spacing.nine,
    paddingBottom: 36,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    color: AUTH_PRIMARY,
    fontWeight: '600',
    marginBottom: Spacing.two,
  },
});
