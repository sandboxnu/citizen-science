import { firestore } from '@/lib/firebase';
import { collection, getDocs } from '@react-native-firebase/firestore';

export type LatLng = { latitude: number; longitude: number };

export type HazardZone = {
  id: string;
  event: string;
  severity: string;
  coordinates: LatLng[];
};

// Minimal shape of the raw Firestore doc we actually read. The seed script
// (firebase/functions/scripts/seed.ts) writes many more NWS-alert-shaped
// fields (certainty, urgency, headline, ...) — not modeled here since
// nothing renders them yet.
type HazardZoneDoc = {
  event?: string;
  severity?: string;
  geometry?: string;
};

// geometry is stored as a JSON string (Firestore doesn't support nested
// arrays), shaped like { type: "Polygon", coordinates: [[[lng, lat], ...]] }.
// Only the outer ring (coordinates[0]) is used — seeded zones have no holes.
export function parseHazardZoneGeometry(geometry: string): LatLng[] {
  const parsed = JSON.parse(geometry) as { type: string; coordinates: [number, number][][] };
  const ring = parsed.coordinates[0] ?? [];
  return ring.map(([longitude, latitude]) => ({ latitude, longitude }));
}

export async function fetchHazardZones(): Promise<HazardZone[]> {
  const snapshot = await getDocs(collection(firestore, 'hazard_zones'));

  const zones: HazardZone[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() as HazardZoneDoc;
    if (!data.geometry) continue;

    try {
      const coordinates = parseHazardZoneGeometry(data.geometry);
      if (coordinates.length === 0) continue;
      zones.push({
        id: doc.id,
        event: data.event ?? 'Unknown event',
        severity: data.severity ?? 'Unknown',
        coordinates,
      });
    } catch {
      // Skip zones with malformed geometry rather than crashing the map.
      continue;
    }
  }
  return zones;
}
