import { firestore } from '@/lib/firebase';
import { collection, getDocs } from '@react-native-firebase/firestore';

export type LatLng = { latitude: number; longitude: number };

export type HazardPolygon = {
  outer: LatLng[];
  holes: LatLng[][];
};

export type HazardZone = {
  id: string;
  polygons: HazardPolygon[];
};

type HazardZoneDoc = {
  geometry?: string;
};

type GeoJsonPolygon = { type: 'Polygon'; coordinates: [number, number][][] };
type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: [number, number][][][] };

const toLatLng = (ring: [number, number][]): LatLng[] =>
  ring.map(([longitude, latitude]) => ({ latitude, longitude }));

const toHazardPolygon = ([outer = [], ...holes]: [number, number][][]): HazardPolygon => ({
  outer: toLatLng(outer),
  holes: holes.map(toLatLng),
});

export function parseHazardZoneGeometry(geometry: string): HazardPolygon[] {
  const parsed = JSON.parse(geometry) as GeoJsonPolygon | GeoJsonMultiPolygon;

  if (parsed.type === 'MultiPolygon') {
    return parsed.coordinates.map(toHazardPolygon);
  }
  return [toHazardPolygon(parsed.coordinates)];
}

export async function fetchHazardZones(): Promise<HazardZone[]> {
  const snapshot = await getDocs(collection(firestore, 'hazard_zones'));

  const zones: HazardZone[] = [];
  for (const doc of snapshot.docs) {
    const data = doc.data() as HazardZoneDoc;
    if (!data.geometry) continue;

    try {
      const polygons = parseHazardZoneGeometry(data.geometry).filter((polygon) => polygon.outer.length > 0);
      if (polygons.length === 0) continue;
      zones.push({ id: doc.id, polygons });
    } catch {
      continue;
    }
  }
  return zones;
}
