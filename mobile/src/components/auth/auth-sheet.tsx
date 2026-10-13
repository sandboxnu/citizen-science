import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

export const AUTH_PRIMARY = '#1F4A8C';

type AuthSheetProps = {
  heading: string;
  children: ReactNode;
};

// Blue hero with the wordmark and a white rounded sheet holding the form.
export function AuthSheet({ heading, children }: AuthSheetProps) {
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Text style={styles.wordmark}>sightline</Text>
      </View>

      <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Text style={styles.heading}>{heading}</Text>
          {children}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AUTH_PRIMARY },
  hero: {
    flex: 0.33,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.six,
  },
  wordmark: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '700',
    letterSpacing: -1,
  },
  sheet: {
    flex: 0.67,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
  },
  form: {
    paddingTop: Spacing.five,
    paddingBottom: 36,
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    color: AUTH_PRIMARY,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.one,
  },
});
