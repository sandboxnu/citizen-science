import * as admin from "firebase-admin";

// Points to local emulator — do not change
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

admin.initializeApp({ projectId: "citizen-science-platform" });

// Seeds mock test users into the Auth emulator for local development, so you
// can sign in immediately without going through the sign-up flow.
// Run from functions/ with: npm run seed:users (emulators must be running)

async function seedUsers() {
  // TODO: implement
}

seedUsers().catch(console.error);
