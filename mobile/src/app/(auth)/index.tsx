import { Link } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// Placeholder UI — TODO: match Figma "Landing" frame. Navigation logic is functional.
export default function LandingScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Welcome
        </ThemedText>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <ThemedView type="backgroundElement" style={styles.button}>
              <ThemedText type="link">Get started</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable>
            <ThemedView type="backgroundElement" style={styles.button}>
              <ThemedText type="link">Sign up</ThemedText>
            </ThemedView>
          </Pressable>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: { textAlign: 'center' },
  button: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
