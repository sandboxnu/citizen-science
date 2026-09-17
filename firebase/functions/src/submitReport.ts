import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// TODO: move to packages/types when mobile app is set up
interface Report {
  userId: string;
  location: admin.firestore.GeoPoint;
  observedAt: string;
  submittedAt: admin.firestore.Timestamp;
  photoUrls?: string[];
  data: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const db = admin.firestore();

// Accepts a flood report from an authenticated citizen and writes it to the reports collection.
export const submitReport = onCall(async (request) => {
  logger.info("submitReport called", {uid: request.auth?.uid});
  // TODO: implement
  return {success: true};
});
