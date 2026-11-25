import { onAuthStateChanged, signOut, type User } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthColors, FontFamily, Spacing } from '@/constants/theme';
import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

// Module-level so it survives remounts but resets on a cold start of the app. Only set once the
// listener has seen a signed-out state, so a failed sign-out is retried rather than treated as done.
let launchSessionCleared = false;

const AuthContext = createContext<AuthContextValue>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Firebase restores the previous session from device storage on launch. Clear it once per cold
  // start so opening the app always lands on the sign-in flow. 
  const clearLaunchSession = async () => {
    try {
      await signOut(auth);
      setSignOutFailed(false);
    } catch (err) {
      console.error('Failed to clear the previous session', err);
      setSignOutFailed(true);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser && !launchSessionCleared) {
        await clearLaunchSession();
        return;
      }
      launchSessionCleared = true;
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  const retry = async () => {
    setRetrying(true);
    await clearLaunchSession();
    setRetrying(false);
  };

  if (signOutFailed && initializing) {
    return <SignOutErrorScreen retrying={retrying} onRetry={retry} />;
  }

  return <AuthContext.Provider value={{ user, initializing }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

function SignOutErrorScreen({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Something went wrong
      </Text>
      <Text style={styles.body}>We couldn’t start a new session. Please try again.</Text>
      <Pressable
        style={styles.button}
        onPress={onRetry}
        disabled={retrying}
        accessibilityRole="button"
        accessibilityLabel="Try again"
        accessibilityState={{ busy: retrying }}>
        {retrying ? (
          <ActivityIndicator color={AuthColors.onPrimary} />
        ) : (
          <Text style={styles.buttonText}>Try again</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    backgroundColor: AuthColors.sheet,
  },
  title: { fontFamily: FontFamily.semiBold, fontSize: 20, color: AuthColors.heading, textAlign: 'center' },
  body: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 19.6, color: AuthColors.inputText, textAlign: 'center' },
  button: {
    alignSelf: 'stretch',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
    borderRadius: 8,
    backgroundColor: AuthColors.primary,
  },
  buttonText: { fontFamily: FontFamily.regular, fontSize: 16, color: AuthColors.signInButtonText },
});
