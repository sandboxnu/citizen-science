import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";
import { assertEmulatorRunning } from "./emulator";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

// Seeds mock NWS flood alerts near the Map tab's default location into
// nws_alerts, in the same shape pollNWSAlerts writes. NC often has no active
// flood alerts, so this is what the map and alert popup are built against.
// data/mock-nws-alerts.json is an api.weather.gov/alerts/active response, so
// real alerts can be pasted in; their times are shifted to start now.

type NWSFeature = {
  geometry: unknown | null;
  properties: Record<string, unknown> & { id: string; sent: string };
};

const DATE_FIELDS = ["sent", "effective", "onset", "expires", "ends"];

const { features }: { features: NWSFeature[] } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/mock-nws-alerts.json"), "utf-8")
);

// Shift every date by the same amount so the alert was sent now and stays
// active for its original duration.
function shiftToNow(properties: NWSFeature["properties"]) {
  const offset = Date.now() - Date.parse(properties.sent);
  const shifted: Record<string, unknown> = { ...properties };
  for (const field of DATE_FIELDS) {
    const value = properties[field];
    if (typeof value === "string") {
      shifted[field] = new Date(Date.parse(value) + offset).toISOString();
    }
  }
  return shifted;
}

async function seed() {
  await assertEmulatorRunning();

  const batch = db.batch();

  for (const { geometry, properties } of features) {
    batch.set(db.collection("nws_alerts").doc(properties.id), {
      ...shiftToNow(properties),
      geometry: geometry ? JSON.stringify(geometry) : null,
      ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();
  console.log(`Seeded ${features.length} mock NWS alerts into nws_alerts.`);
}

seed().catch(console.error);
