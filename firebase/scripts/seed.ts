import * as admin from "firebase-admin";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform" });

const db = admin.firestore();

// Seeds fake hazard zones into Firestore for local development.
// Use this when there are no active NC flood alerts from NWS to test against.
// Run with: npx ts-node scripts/seed.ts (emulator must be running first)

interface SeedHazardZone {
  id: string;
  raw: Record<string, unknown>;
  ingestedAt: admin.firestore.FieldValue;
}

const hazardZones: SeedHazardZone[] = [
  // TODO: add 3-5 fake hazard zones with real NC polygon coordinates, for example:
  // {
  //   id: "seed-zone-1",
  //   raw: {
  //     type: "Feature",
  //     geometry: {
  //       type: "Polygon",
  //       coordinates: [[
  //         [-78.9, 35.9], [-78.7, 35.9], [-78.7, 35.7], [-78.9, 35.7], [-78.9, 35.9]
  //       ]]
  //     },
  //     properties: {
  //       event: "Flood Warning",
  //       severity: "Moderate",
  //       areaDesc: "Wake County",
  //       expires: "2026-09-17T00:00:00Z",
  //     }
  //   },
  //   ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
  // },
];

async function seed() {
  const batch = db.batch();

  hazardZones.forEach((zone) => {
    const ref = db.collection("hazard_zones").doc(zone.id);
    batch.set(ref, zone);
  });

  await batch.commit();
  console.log(`Seeded ${hazardZones.length} hazard zones into Firestore.`);
}

seed().catch(console.error);
