import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AUTH_PRIMARY, AuthSheet } from '@/components/auth/auth-sheet';
import { PasswordField, UsernameField } from '@/components/auth/form-field';
import { Spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';

export default function SignInScreen() {
  // TODO: support signing in by username (look up the user's email first).
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    }
  }

  return (
    <AuthSheet heading="Welcome back">
      <UsernameField
        placeholder="Enter your username or email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <PasswordField placeholder="Enter your password" value={password} onChangeText={setPassword} />

      {/* TODO: wire up password reset */}
      <Pressable style={styles.forgot}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable>
          <Text style={[styles.link, styles.centered]}>Don&apos;t have an account? Sign up</Text>
        </Pressable>
      </Link>
    </AuthSheet>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-end' },
  error: { color: '#d33', fontSize: 14 },
  button: {
    backgroundColor: AUTH_PRIMARY,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.five,
  },
  buttonText: { color: '#ffffff', fontSize: 16 },
  link: { color: AUTH_PRIMARY, fontSize: 16 },
  centered: { textAlign: 'center' },
});
