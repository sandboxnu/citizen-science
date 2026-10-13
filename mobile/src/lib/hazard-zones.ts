import { firestore } from '@/lib/firebase';
import { collection, getDocs } from '@react-native-firebase/firestore';

export type LatLng = { latitude: number; longitude: number };

export type HazardZone = {
  id: string;
  rings: LatLng[][];
};

type HazardZoneDoc = {
  geometry?: string;
};

type GeoJsonPolygon = { type: 'Polygon'; coordinates: [number, number][][] };
type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: [number, number][][][] };

const toLatLng = (ring: [number, number][]): LatLng[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

export function parseHazardZoneGeometry(geometry: string): LatLng[][] {
  const parsed = JSON.parse(geometry) as GeoJsonPolygon | GeoJsonMultiPolygon;

  if (parsed.type === 'MultiPolygon') {
    return parsed.coordinates.map((polygon) => toLatLng(polygon[0] ?? []));
  }
  return [toLatLng(parsed.coordinates[0] ?? [])];
}

export async function fetchHazardZones(): Promise<HazardZone[]> {
  const snapshot = await getDocs(collection(firestore, 'hazard_zones'));

  const zones: HazardZone[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() as HazardZoneDoc;
    if (!data.geometry) continue;

    try {
      const rings = parseHazardZoneGeometry(data.geometry).filter((ring) => ring.length > 0);
      if (rings.length === 0) continue;
      zones.push({ id: doc.id, rings });
    } catch {
      continue;
    }
  }
  return zones;
}
