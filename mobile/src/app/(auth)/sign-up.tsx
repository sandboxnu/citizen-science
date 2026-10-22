import { createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch } from '@react-native-firebase/firestore';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthSheet } from '@/components/auth/auth-sheet';
import { FormField, PasswordField, UsernameField } from '@/components/auth/form-field';
import { AuthColors, FontFamily, Spacing } from '@/constants/theme';
import { auth, firestore } from '@/lib/firebase';

type FieldErrors = Partial<Record<'firstName' | 'email' | 'username' | 'password', string>>;

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSignUp() {
    setError(null);
    const usernameKey = username.trim().toLowerCase();
    const nextErrors: FieldErrors = {
      firstName: firstName.trim() === '' ? 'Name is required.' : undefined,
      email: email.trim() === '' ? 'Email is required.' : undefined,
      username:
        usernameKey === ''
          ? 'Username is required.'
          : /[@/]/.test(usernameKey) || usernameKey.startsWith('.')
            ? "Username can't contain @ or /, or start with a period."
            : undefined,
      password: password === '' ? 'Password is required.' : undefined,
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    try {
      const usernameRef = doc(firestore, 'usernames', usernameKey);
      if ((await getDoc(usernameRef)).exists()) {
        setFieldErrors({ username: 'That username is taken.' });
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const batch = writeBatch(firestore);
      batch.set(doc(firestore, 'users', credential.user.uid), {
        email: credential.user.email,
        firstName,
        ...(lastName !== '' && { lastName }),
        username,
        createdAt: serverTimestamp(),
      });
      batch.set(usernameRef, { uid: credential.user.uid, email: credential.user.email });
      await batch.commit();
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
          error={fieldErrors.firstName}
          onChangeText={(text) => {
            setFirstName(text);
            clearFieldError('firstName');
          }}
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
        error={fieldErrors.email}
        onChangeText={(text) => {
          setEmail(text);
          clearFieldError('email');
        }}
      />
      <UsernameField
        required
        placeholder="Enter a username"
        value={username}
        error={fieldErrors.username}
        onChangeText={(text) => {
          setUsername(text);
          clearFieldError('username');
        }}
      />
      <PasswordField
        required
        placeholder="Enter a password"
        autoComplete="new-password"
        textContentType="newPassword"
        value={password}
        error={fieldErrors.password}
        onChangeText={(text) => {
          setPassword(text);
          clearFieldError('password');
        }}
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
  error: { color: AuthColors.error, fontFamily: FontFamily.regular, fontSize: 14 },
  button: {
    backgroundColor: AuthColors.primary,
    paddingVertical: Spacing.ten,
    borderRadius: Spacing.two,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  buttonText: { color: AuthColors.onPrimary, fontFamily: FontFamily.regular, fontSize: 14 },
  link: { color: AuthColors.primary, fontFamily: FontFamily.regular, fontSize: 14, textAlign: 'center' },
});
