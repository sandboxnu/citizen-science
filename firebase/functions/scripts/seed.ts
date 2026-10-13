import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

type Ring = [number, number][]; // [lng, lat], first point == last point

const mockHazardZoneBoundaries: Record<string, Ring> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/mock-hazard-zones.json"), "utf-8")
);

const polygon = (ring: Ring) => JSON.stringify({ type: "Polygon", coordinates: [ring] });

const hazardZones: Record<string, { geometry: string }> = {
  "seed-wake-flood-warning": { geometry: polygon(mockHazardZoneBoundaries.WAKE_COUNTY) },
  "seed-ne-nc-flash-flood-warning": { geometry: polygon(mockHazardZoneBoundaries.NE_NC_FLASH_FLOOD) },
  "seed-outer-banks-coastal-flood-warning": { geometry: polygon(mockHazardZoneBoundaries.NORTHERN_OUTER_BANKS) },
  "seed-mecklenburg-flood-watch": { geometry: polygon(mockHazardZoneBoundaries.MECKLENBURG_COUNTY) },
  "seed-new-hanover-flood-advisory": { geometry: polygon(mockHazardZoneBoundaries.NEW_HANOVER_COUNTY) },
};

async function seed() {
  const batch = db.batch();

  Object.entries(hazardZones).forEach(([id, zone]) => {
    const ref = db.collection("hazard_zones").doc(id);
    batch.set(ref, {
      ...zone,
      active: true,
      ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Seeded ${Object.keys(hazardZones).length} hazard zones into Firestore.`);
}

seed().catch(console.error);
