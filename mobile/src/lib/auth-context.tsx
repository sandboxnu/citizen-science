import { onAuthStateChanged, signOut, type User } from '@react-native-firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { auth } from '@/lib/firebase';

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, initializing: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      if (nextUser) {
        // The emulator wipes its accounts on restart, but the device keeps the cached session.
        // Reloading fails for an account that no longer exists, so sign out instead of leaving a
        // signed-in user with no profile.
        try {
          await nextUser.reload();
        } catch (err) {
          if ((err as { code?: string }).code === 'auth/user-not-found') {
            await signOut(auth);
            return;
          }
        }
      }
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  return <AuthContext.Provider value={{ user, initializing }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
