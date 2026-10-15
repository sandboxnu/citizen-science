import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

const NWS_ALERTS_URL =
  "https://api.weather.gov/alerts/active?area=NC&event=" +
  "Flood+Warning,Flood+Watch,Flash+Flood+Warning,Flash+Flood+Watch";

const USER_AGENT =
  "(citizen-science-platform, " +
  "https://github.com/sandboxnu/citizen-science)";

const BATCH_LIMIT = 500;

interface NWSFeature {
  geometry: unknown | null;
  properties: Record<string, unknown> & {id?: string};
}

// // TODO: move to packages/types when mobile app is set up
// interface HazardZone {
//   id: string;
//   raw: Record<string, unknown>;
//   ingestedAt: admin.firestore.Timestamp;
// }

const db = admin.firestore();

// Polls NWS API for active NC flood alerts every 5 minutes and upserts
// them into nws_alerts.
export const pollNWSAlerts = onSchedule("every 5 minutes", async () => {
  logger.info("pollNWSAlerts triggered");
  const response = await fetch(NWS_ALERTS_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "application/geo+json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `NWS request failed: ${response.status} ${response.statusText}`
    );
  }

  const features: NWSFeature[] = (await response.json())?.features ?? [];

  const alerts = features.filter((feature) => {
    if (feature?.properties?.id) return true;
    logger.warn("Skipping NWS alert with no properties.id", {feature});
    return false;
  });

  for (let i = 0; i < alerts.length; i += BATCH_LIMIT) {
    const batch = db.batch();

    for (const {geometry, properties} of alerts.slice(i, i + BATCH_LIMIT)) {
      batch.set(db.collection("nws_alerts").doc(properties.id as string), {
        ...properties,
        geometry: geometry ? JSON.stringify(geometry) : null,
        ingestedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }

  logger.info(`pollNWSAlerts upserted ${alerts.length} NWS alerts`);
});
