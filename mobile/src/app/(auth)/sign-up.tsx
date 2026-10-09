import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { doc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { auth, firestore } from '@/lib/firebase';

// Placeholder UI — real design pending Figma. Logic (Firebase Auth sign-up +
// Firestore profile creation) is functional. "Signup with Google" is UI-only (separate ticket).
export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(firestore, 'users', credential.user.uid), {
        email: credential.user.email,
        firstName,
        ...(lastName !== '' && { lastName }),
        username,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed');
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Sign Up
        </ThemedText>

        <TextInput
          style={styles.input}
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last name (optional)"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error && (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        )}

        <Pressable onPress={handleSignUp}>
          <ThemedView type="backgroundElement" style={styles.button}>
            <ThemedText type="link">Sign Up</ThemedText>
          </ThemedView>
        </Pressable>

        <ThemedView style={styles.dividerRow}>
          <ThemedView type="backgroundElement" style={styles.dividerLine} />
          <ThemedText type="small" themeColor="textSecondary">
            or
          </ThemedText>
          <ThemedView type="backgroundElement" style={styles.dividerLine} />
        </ThemedView>

        <Pressable disabled>
          <ThemedView type="backgroundElement" style={styles.button}>
            <ThemedText type="link">Signup with Google</ThemedText>
          </ThemedView>
        </Pressable>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable>
            <ThemedText type="linkPrimary">Already have an account? Login</ThemedText>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  button: {
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  error: { color: '#d33' },
});
