import { app, firestore, getEmulatorHost } from '@/lib/firebase';
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


async function fetchHazardZoneDocsFromEmulator(): Promise<{ id: string; data: HazardZoneDoc }[]> {
  type RestDoc = { name: string; fields?: { geometry?: { stringValue?: string } } };
  const baseUrl =
    `http://${getEmulatorHost()}:8080/v1/projects/${app.options.projectId}` +
    '/databases/(default)/documents/hazard_zones';

  const docs: { id: string; data: HazardZoneDoc }[] = [];
  let pageToken: string | undefined;
  do {
    const url = `${baseUrl}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Emulator read failed: ${response.status}`);
    const body = (await response.json()) as { documents?: RestDoc[]; nextPageToken?: string };
    for (const doc of body.documents ?? []) {
      docs.push({
        id: doc.name.split('/').pop() ?? doc.name,
        data: { geometry: doc.fields?.geometry?.stringValue },
      });
    }
    pageToken = body.nextPageToken;
  } while (pageToken);
  return docs;
}

async function fetchHazardZoneDocs(): Promise<{ id: string; data: HazardZoneDoc }[]> {
  if (__DEV__) return fetchHazardZoneDocsFromEmulator();
  const snapshot = await getDocs(collection(firestore, 'hazard_zones'));
  return snapshot.docs.map((doc) => ({ id: doc.id, data: doc.data() as HazardZoneDoc }));
}

export async function fetchHazardZones(): Promise<HazardZone[]> {
  const zones: HazardZone[] = [];
  for (const { id, data } of await fetchHazardZoneDocs()) {
    if (!data.geometry) continue;

    try {
      const polygons = parseHazardZoneGeometry(data.geometry).filter((polygon) => polygon.outer.length > 0);
      if (polygons.length === 0) continue;
      zones.push({ id, polygons });
    } catch {
      continue;
    }
  }
  return zones;
}
