import * as admin from "firebase-admin";
import * as path from "path";
import * as fs from "fs";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

type PolygonGeometry = { type: "Polygon"; coordinates: [number, number][][] };

const mockHazardZones: Record<string, PolygonGeometry> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/mock-hazard-zones.json"), "utf-8")
);

const hazardZones: Record<string, { geometry: string }> = Object.fromEntries(
  Object.entries(mockHazardZones).map(([id, geometry]) => [id, { geometry: JSON.stringify(geometry) }])
);

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
