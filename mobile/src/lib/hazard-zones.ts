import { firestore } from '@/lib/firebase';
import { collection, getDocs } from '@react-native-firebase/firestore';

export type LatLng = { latitude: number; longitude: number };

export type HazardZone = {
  id: string;
  coordinates: LatLng[];
};

// Minimal shape of the raw Firestore doc we actually read — matches what
// both firebase/functions/scripts/seed.ts (hazard_zones) and
// scripts/seed-client.ts (clientData) write: { geometry, active, ingestedAt }.
type HazardZoneDoc = {
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
      zones.push({ id: doc.id, coordinates });
    } catch {
      // Skip zones with malformed geometry rather than crashing the map.
      continue;
    }
  }
  return zones;
}
