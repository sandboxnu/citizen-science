import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { doc, serverTimestamp, setDoc } from '@react-native-firebase/firestore';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AUTH_PRIMARY, AuthSheet } from '@/components/auth/auth-sheet';
import { FormField, PasswordField, UsernameField } from '@/components/auth/form-field';
import { Spacing } from '@/constants/theme';
import { auth, firestore } from '@/lib/firebase';

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
    <AuthSheet heading="Create your account">
      <View style={styles.row}>
        <FormField
          style={styles.rowItem}
          label="First name"
          required
          placeholder="Enter first name"
          value={firstName}
          onChangeText={setFirstName}
        />
        <FormField
          style={styles.rowItem}
          label="Last name"
          placeholder="Enter last name"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>
      <FormField
        label="Email"
        required
        placeholder="Enter a email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <UsernameField
        required
        placeholder="Enter a username"
        value={username}
        onChangeText={setUsername}
      />
      <PasswordField
        required
        placeholder="Enter a password"
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        onChangeText={setPassword}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Signup</Text>
      </Pressable>

      <Link href="/(auth)/sign-in" asChild>
        <Pressable>
          <Text style={styles.link}>Already have an account? Login</Text>
        </Pressable>
      </Link>
    </AuthSheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  rowItem: { flex: 1, fontSize: 14 },
  error: { color: '#d33', fontSize: 14 },
  button: {
    backgroundColor: AUTH_PRIMARY,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  buttonText: { color: '#ffffff', fontSize: 16 },
  link: { color: AUTH_PRIMARY, fontSize: 16, textAlign: 'center' },
});
