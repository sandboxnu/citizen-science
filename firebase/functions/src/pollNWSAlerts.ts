import {onSchedule} from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";

// Polls NWS API for active NC flood alerts every 5 minutes and upserts into hazard_zones.
export const pollNWSAlerts = onSchedule("every 5 minutes", async () => {
  logger.info("pollNWSAlerts triggered");
  // TODO: implement
});
