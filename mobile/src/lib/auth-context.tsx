import { onAuthStateChanged, signOut, type User } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

// Module-level so it survives remounts but resets on a cold start of the app.
let launchSessionCleared = false;

const AuthContext = createContext<AuthContextValue>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      // Firebase restores the previous session from device storage on launch. Clear it once per
      // cold start so opening the app always lands on the sign-in flow. The sign-out triggers
      // this listener again with a null user, which finishes initializing.
      if (nextUser && !launchSessionCleared) {
        launchSessionCleared = true;
        await signOut(auth);
        return;
      }
      launchSessionCleared = true;
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, initializing }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
