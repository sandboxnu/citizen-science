import * as admin from "firebase-admin";
import * as gdal from 'gdal-async';

// TODO: use this in place of Record<string, unknown> below, and validate
// records against it before writing (see seed-client.test.ts)
export interface ClientFloodRecord {
  geometry: string;
}

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform-dev" });

const db = admin.firestore();

const MAX_RECORDS = Number(process.env.MAX_RECORDS) || 50

const clientData: Record<string, ClientFloodRecord> = {};

const dataset = gdal.open("data/Unified_FIM.gpkg");

export function isClientFloodRecord(flood_record: unknown): flood_record is ClientFloodRecord {
  if (typeof flood_record !== 'object' || flood_record === null) {
    console.log("Invalid flood record: not an object or null");
    return false;
  }

  const potential = flood_record as Record<string, unknown>;
  let geom;

  if (typeof potential.geometry === "string") {
    try {
     geom = JSON.parse(potential.geometry)
    } catch {
      return false;
    }

    return geom.coordinates.every((ring: any) => 
      ring.every((val: number[]) => val.every((coord: number) => Number.isFinite(coord)))
    );
  }
  return false
}


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
