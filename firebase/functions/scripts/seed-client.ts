import * as admin from "firebase-admin";
import * as gdal from 'gdal-async';

// TODO: use this in place of Record<string, unknown> below, and validate
// records against it before writing (see seed-client.test.ts)
export interface ClientFloodRecord {
  geometry: string;
}

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform" });

const db = admin.firestore();

const MAX_RECORDS = Number(process.env.MAX_RECORDS) || 50

const clientData: Record<string,Record<string, unknown>> = {};

const dataset = gdal.open("data/Unified_FIM.gpkg");


const layer = dataset.layers.get(0);

let record_index = 0;
    layer.features.forEach((feature) => {
      if (record_index >= MAX_RECORDS) { return}
      const id = String(feature.fid);
      const geom = feature.getGeometry();
      //console.log(geom)
      clientData[id] = {
        geometry: JSON.stringify(geom?.toObject()), 
  };

  record_index +=1
}

    )


async function seed() {
  const batch = db.batch();

  Object.entries(clientData).forEach(([id, zone]) => {
    const ref = db.collection("clientData").doc(id);
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
