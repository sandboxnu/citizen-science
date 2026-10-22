import { firestore } from '@/lib/firebase';
import { parseHazardZoneGeometry, type HazardPolygon } from '@/lib/hazard-zones';
import { collection, onSnapshot, type Unsubscribe } from '@react-native-firebase/firestore';

export type NwsAlert = {
  id: string;
  polygons: HazardPolygon[];
  event: string;
  messageType: string;
  severity: string;
  sent: string;
  areaDesc?: string;
  effective?: string;
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

function isActive(alert: NwsAlertDoc): boolean {
  if (alert.messageType === 'Cancel') {
    return false;
  } 
  return !alert.expires || Date.parse(alert.expires) > Date.now();
}

export function subscribeToNwsAlerts(
  onChange: (alerts: NwsAlert[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  return onSnapshot(
    collection(firestore, 'nws_alerts'),
    (snapshot) => {
      onChange(
        snapshot.docs
          .map((doc) => ({ id: doc.id, data: doc.data() as NwsAlertDoc }))
          .filter(({ data }) => isActive(data))
          .map(({ id, data: { geometry, ...fields } }) => ({ ...fields, id, polygons: parsePolygons(geometry) }))
      );
    },
    onError
  );
}
