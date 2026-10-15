import * as admin from "firebase-admin";
import { assertEmulatorRunning } from "./emulator";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

// Empties the map data collections. Leaves users/usernames alone, since their
// Auth emulator accounts would still exist without them. For a full reset,
// restart `npm run dev` (the emulator starts empty).
const COLLECTIONS = ["hazard_zones", "nws_alerts"];

async function clear() {
  await assertEmulatorRunning();

  for (const name of COLLECTIONS) {
    await db.recursiveDelete(db.collection(name));
  }
  console.log(`Cleared ${COLLECTIONS.join(", ")}.`);
}

clear().catch(console.error);
