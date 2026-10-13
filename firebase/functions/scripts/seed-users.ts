import * as admin from "firebase-admin";

// Points to local emulator — do not change
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });


async function seedUsers() {
  // TODO: implement
}

seedUsers().catch(console.error);
