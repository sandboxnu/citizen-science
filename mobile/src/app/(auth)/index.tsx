import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Spacing } from '@/constants/theme';

const PRIMARY = '#054A91';
const PRIMARY_LIGHT = '#BBDEFF';
const NAVY = '#043567';

export default function LandingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <Text style={styles.wordmark}>sightline</Text>
      </View>

      <View style={[styles.sheet, { paddingBottom: Spacing.three }]}>
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
  container: { flex: 1, backgroundColor: PRIMARY },
  hero: {
    flex: 0.55,
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
    flex: 0.45,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: Spacing.nine,
    paddingHorizontal: Spacing.four,
    justifyContent: 'space-between',
  },
  welcome: {
    color: NAVY,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
  buttons: { gap: Spacing.seven },
  button: {
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  buttonText: { fontSize: 16 },
  primaryButton: { backgroundColor: PRIMARY },
  primaryButtonText: { color: '#ffffff', fontSize: 14 },
  secondaryButton: { backgroundColor: PRIMARY_LIGHT },
  secondaryButtonText: { color: NAVY, fontSize: 14 },
});
