import { signInWithEmailAndPassword } from '@react-native-firebase/auth';
import { doc, getDoc } from '@react-native-firebase/firestore';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { AUTH_PRIMARY, AuthSheet } from '@/components/auth/auth-sheet';
import { PasswordField, UsernameField } from '@/components/auth/form-field';
import { Spacing } from '@/constants/theme';
import { auth, firestore } from '@/lib/firebase';

type FieldErrors = Partial<Record<'email' | 'password', string>>;

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSignIn() {
    setError(null);
    const nextErrors: FieldErrors = {
      email: email.trim() === '' ? 'Username is required.' : undefined,
      password: password === '' ? 'Password is required.' : undefined,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      // Anything without an @ is a username; look up its email first.
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        const snapshot = await getDoc(doc(firestore, 'usernames', loginEmail.toLowerCase()));
        if (!snapshot.exists()) {
          setFieldErrors({ email: 'No account exists with this username.' });
          return;
        }
        loginEmail = snapshot.data()?.email;
      }
      await signInWithEmailAndPassword(auth, loginEmail, password);
    } catch (err) {
      const code = (err as { code?: string }).code;
      switch (code) {
        case 'auth/invalid-email':
          setFieldErrors({ email: 'Enter a valid username or email.' });
          break;
        case 'auth/user-not-found':
          setFieldErrors({ email: 'No account exists for this email. Please create an account first.' });
          break;
        case 'auth/wrong-password':
          setFieldErrors({ password: 'Incorrect password.' });
          break;
        case 'auth/invalid-credential':
          setFieldErrors({ password: 'Email or password is incorrect.' });
          break;
        default:
          setError(err instanceof Error ? err.message : 'Sign in failed');
      }
    }
  }

  return (
    <AuthSheet heading="Welcome back" headingSize={24} sheetRatio={0.51}>
      <UsernameField
        required
        placeholder="Enter your username or email"
        keyboardType="email-address"
        value={email}
        error={fieldErrors.email}
        onChangeText={(text) => {
          setEmail(text);
          clearFieldError('email');
        }}
      />
      <PasswordField
        required
        placeholder="Enter your password"
        value={password}
        error={fieldErrors.password}
        onChangeText={(text) => {
          setPassword(text);
          clearFieldError('password');
        }}
      />

      {/* TODO: wire up password reset */}
      <Pressable style={styles.forgot}>
        <Text style={styles.link}>Forgot password?</Text>
      </Pressable>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Login</Text>
      </Pressable>

      <Link href="/(auth)/sign-up" asChild>
        <Pressable style={styles.signUp}>
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
    paddingVertical: Spacing.ten,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: { color: '#F3F9FF', fontSize: 14 },
  signUp: { marginTop: 6 },
  link: { color: AUTH_PRIMARY, fontSize: 14 },
  centered: { textAlign: 'center', fontSize: 14, color: AUTH_PRIMARY },
});
