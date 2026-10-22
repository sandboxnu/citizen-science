import { firestore } from '@/lib/firebase';
import { parseHazardZoneGeometry, type HazardPolygon } from '@/lib/hazard-zones';
import { collection, getDocs } from '@react-native-firebase/firestore';

// An NWS flood alert from the nws_alerts collection (written by
// pollNWSAlerts, or seed:nws-mock locally). Field names follow
// api.weather.gov/alerts. polygons is empty for alerts NWS sends without a
// shape (mostly Flood Watches).
export type NwsAlert = {
  id: string;
  polygons: HazardPolygon[];
  event: string;
  messageType: string;
  severity: string;
  sent: string;
  onset?: string;
  ends?: string;
  expires?: string;
  description?: string;
  instruction?: string;
};

type NwsAlertDoc = Omit<NwsAlert, 'id' | 'polygons'> & { geometry?: string | null };

function parsePolygons(geometry: string | null | undefined): HazardPolygon[] {
  if (!geometry) return [];
  try {
    return parseHazardZoneGeometry(geometry).filter((polygon) => polygon.outer.length > 0);
  } catch {
    return [];
  }
}

// NWS's active feed includes "this alert has been cancelled" messages, and
// alerts can expire between polls, so neither should be shown.
function isActive(alert: NwsAlertDoc): boolean {
  if (alert.messageType === 'Cancel') return false;
  return !alert.expires || Date.parse(alert.expires) > Date.now();
}

export async function fetchNwsAlerts(): Promise<NwsAlert[]> {
  const snapshot = await getDocs(collection(firestore, 'nws_alerts'));

  return snapshot.docs
    .map((doc) => ({ id: doc.id, data: doc.data() as NwsAlertDoc }))
    .filter(({ data }) => isActive(data))
    .map(({ id, data: { geometry, ...fields } }) => ({ ...fields, id, polygons: parsePolygons(geometry) }));
}
