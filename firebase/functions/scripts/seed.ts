import * as admin from "firebase-admin";

// Points to local emulator — do not change
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

admin.initializeApp({ projectId: "citizen-science-platform" });

const db = admin.firestore();

// Seeds fake hazard zones into Firestore for local development.
// Use this when there are no active NC flood alerts from NWS to test against.
// Run from functions/ with: npm run seed (emulators must be running, see ../README.md)

type Ring = [number, number][]; // [lng, lat], first point == last point

// Simplified real boundaries from api.weather.gov/zones, except the Flash Flood
// Warning, which is a real NWS storm-based warning polygon.
const WAKE_COUNTY: Ring = [
  [-78.5469, 36.0219], [-78.4265, 35.9747], [-78.3945, 35.9368], [-78.3543, 35.9311],
  [-78.3497, 35.9093], [-78.3366, 35.906], [-78.3297, 35.8972], [-78.3077, 35.8955],
  [-78.2823, 35.8716], [-78.2554, 35.8285], [-78.2552, 35.8172], [-78.4319, 35.7206],
  [-78.4686, 35.7071], [-78.7078, 35.5189], [-78.9956, 35.6103], [-78.9093, 35.8429],
  [-78.906, 35.8679], [-78.8303, 35.8671], [-78.8061, 35.9278], [-78.7589, 35.9188],
  [-78.7135, 35.9689], [-78.6993, 36.0125], [-78.7063, 36.0129], [-78.7199, 36.0298],
  [-78.7387, 36.0234], [-78.7528, 36.0319], [-78.7492, 36.0712], [-78.6831, 36.0744],
  [-78.5469, 36.0219],
];

const NE_NC_FLASH_FLOOD: Ring = [
  [-76.76, 36.35], [-76.62, 36.38], [-76.52, 36.36], [-76.54, 36.04], [-76.6, 36.04],
  [-76.61, 36.05], [-76.59, 36.05], [-76.63, 36.06], [-76.65, 36.07], [-76.63, 36.05],
  [-76.62, 36.05], [-76.64, 36.04], [-76.7, 36.03], [-76.79, 36.08], [-76.76, 36.35],
];

const NORTHERN_OUTER_BANKS: Ring = [
  [-75.7732, 36.2315], [-75.7094, 36.0974], [-75.5698, 35.8633], [-75.5344, 35.7926],
  [-75.54, 35.7752], [-75.5442, 35.7967], [-75.5955, 35.8544], [-75.5984, 35.8956],
  [-75.6155, 35.8995], [-75.601, 35.9077], [-75.6211, 35.9443], [-75.6678, 35.972],
  [-75.6865, 36.0148], [-75.6876, 35.996], [-75.7285, 36.0042], [-75.7227, 36.0241],
  [-75.7018, 36.0088], [-75.6916, 36.0246], [-75.6801, 36.0156], [-75.6981, 36.0599],
  [-75.7383, 36.0418], [-75.7519, 36.1227], [-75.739, 36.1092], [-75.7732, 36.2315],
];

const MECKLENBURG_COUNTY: Ring = [
  [-80.8011, 35.5071], [-80.7841, 35.507], [-80.7526, 35.4145], [-80.766, 35.4026],
  [-80.6938, 35.3467], [-80.6665, 35.2677], [-80.5503, 35.2084], [-80.7704, 35.0344],
  [-80.8047, 35.0278], [-80.8402, 35.002], [-80.9337, 35.1061], [-81.0415, 35.0447],
  [-81.0574, 35.0619], [-81.057, 35.0848], [-81.0325, 35.1096], [-81.0511, 35.1338],
  [-81.0437, 35.1487], [-81.0063, 35.156], [-81.0026, 35.1722], [-81.014, 35.2725],
  [-80.9827, 35.3422], [-80.9232, 35.3601], [-80.9592, 35.3751], [-80.9786, 35.3649],
  [-80.9867, 35.376], [-80.9551, 35.3933], [-80.9465, 35.4865], [-80.9101, 35.5149],
  [-80.8011, 35.5071],
];

const NEW_HANOVER_COUNTY: Ring = [
  [-77.8209, 34.3851], [-77.7423, 34.2985], [-77.8195, 34.2106], [-77.8409, 34.2183],
  [-77.8376, 34.1777], [-77.8644, 34.1906], [-77.8466, 34.166], [-77.9372, 33.9286],
  [-77.911, 34.0295], [-77.9252, 34.1282], [-77.9515, 34.2324], [-78.0299, 34.3318],
  [-77.9941, 34.337], [-77.9625, 34.3832], [-77.9352, 34.3584], [-77.8209, 34.3851],
];

const polygon = (ring: Ring) => JSON.stringify({ type: "Polygon", coordinates: [ring] });

// Matches the minimal shape scripts/seed-client.ts writes to `clientData`
// ({ geometry, active, ingestedAt }) — geometry is a JSON string because
// Firestore does not support nested arrays; clients should
// JSON.parse(doc.geometry) before rendering.
const hazardZones: Record<string, { geometry: string }> = {
  "seed-wake-flood-warning": { geometry: polygon(WAKE_COUNTY) },
  "seed-ne-nc-flash-flood-warning": { geometry: polygon(NE_NC_FLASH_FLOOD) },
  "seed-outer-banks-coastal-flood-warning": { geometry: polygon(NORTHERN_OUTER_BANKS) },
  "seed-mecklenburg-flood-watch": { geometry: polygon(MECKLENBURG_COUNTY) },
  "seed-new-hanover-flood-advisory": { geometry: polygon(NEW_HANOVER_COUNTY) },
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
