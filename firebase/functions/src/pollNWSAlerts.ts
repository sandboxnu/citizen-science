import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// TODO: move to packages/types when mobile app is set up
interface HazardZone {
  id: string;
  raw: Record<string, unknown>;
  ingestedAt: admin.firestore.Timestamp;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const db = admin.firestore();

// Polls NWS API for active NC flood alerts every 5 minutes and upserts into hazard_zones.
export const pollNWSAlerts = onSchedule("every 5 minutes", async () => {
  logger.info("pollNWSAlerts triggered");
  // TODO: implement
});
