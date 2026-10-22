import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthColors, FontFamily, Spacing } from '@/constants/theme';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Text style={styles.wordmark}>sightline</Text>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.welcome}>Welcome</Text>

        <View style={styles.buttons}>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable style={StyleSheet.flatten([styles.button, styles.primaryButton])}>
              <Text style={[styles.buttonText, styles.primaryButtonText]}>Get started</Text>
            </Pressable>
          </Link>

          <Link href="/(auth)/sign-up" asChild>
            <Pressable style={StyleSheet.flatten([styles.button, styles.secondaryButton])}>
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>Sign up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AuthColors.primary },
  hero: {
    flex: 0.55,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: Spacing.eight,
  },
  wordmark: {
    color: AuthColors.wordmark,
    fontSize: 40,
    fontFamily: FontFamily.bold,
    letterSpacing: -1,
  },
  sheet: {
    flex: 0.45,
    backgroundColor: AuthColors.sheet,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Spacing.nine,
    paddingBottom: 36,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  welcome: {
    color: AuthColors.heading,
    fontSize: 24,
    fontFamily: FontFamily.semiBold,
    textAlign: 'center',
  },
  buttons: { gap: Spacing.seven },
  button: {
    paddingVertical: Spacing.ten,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: { fontFamily: FontFamily.regular, fontSize: 16 },
  primaryButton: { backgroundColor: AuthColors.primary },
  primaryButtonText: { color: AuthColors.onPrimary, fontFamily: FontFamily.regular, fontSize: 14 },
  secondaryButton: { backgroundColor: AuthColors.secondary },
  secondaryButtonText: { color: AuthColors.onSecondary, fontFamily: FontFamily.regular, fontSize: 14 },
});
