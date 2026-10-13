import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { getApp } from "@react-native-firebase/app";
import { getAuth, connectAuthEmulator } from "@react-native-firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  clearPersistence,
} from "@react-native-firebase/firestore";
import {
  getStorage,
  connectStorageEmulator,
} from "@react-native-firebase/storage";

const app = getApp();
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// Physical devices can't reach "localhost" (that's the phone itself), so we
// resolve the dev machine's LAN IP from the same host Metro is already using.
// The iOS simulator shares the Mac's network directly; the Android emulator
// maps the host machine to a fixed alias instead of a real IP.
function getEmulatorHost(): string {
  if (Device.isDevice) {
    const lanHost = Constants.expoConfig?.hostUri?.split(":")[0];
    return lanHost ?? "127.0.0.1";
  }
  return Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
}

if (__DEV__) {
  const host = getEmulatorHost();
  connectAuthEmulator(auth, `http://${host}:9099`);
  connectFirestoreEmulator(firestore, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  clearPersistence(firestore).catch(() => {});
}

export { app, auth, firestore, storage };
