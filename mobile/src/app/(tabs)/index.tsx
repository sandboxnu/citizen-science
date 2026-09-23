import { signOut } from '@react-native-firebase/auth';
import { Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { auth } from '@/lib/firebase';

// Placeholder — will show hazard zones + reports on a map once designs land.
export default function MapScreen() {
  const { user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title">Map</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Placeholder — hazard zones and reports go here.
        </ThemedText>
        <ThemedText type="small">Signed in as {user?.email}</ThemedText>

        <Pressable onPress={() => signOut(auth)}>
          <ThemedText type="linkPrimary">Sign out</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
});
