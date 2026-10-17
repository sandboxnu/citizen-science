import * as admin from "firebase-admin";
import * as gdal from 'gdal-async';
import { isClientFloodRecord, type ClientFloodRecord } from "./client-flood-record";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

const MAX_RECORDS = Number(process.env.MAX_RECORDS) || 50

const clientData: Record<string, ClientFloodRecord> = {};

const dataset = gdal.open("data/Unified_FIM.gpkg");

const layer = dataset.layers.get(0);

let record_index = 0;
layer.features.forEach((feature) => {
  if (record_index >= MAX_RECORDS) { return; }
  const id = String(feature.fid);
  const geom = feature.getGeometry();
  const candidate: unknown = { geometry: JSON.stringify(geom?.toObject()) };
  if (isClientFloodRecord(candidate)) {
    clientData[id] = candidate;
  }
  record_index += 1;
});


async function seed() {
  const batch = db.batch();

  Object.entries(clientData).forEach(([id, zone]) => {
    const ref = db.collection("hazard_zones").doc(id);
    batch.set(ref, {
      ...zone,
      active: true,
      ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Seeded ${Object.keys(clientData).length} client records into Firestore.`);
}

seed().catch(console.error);
