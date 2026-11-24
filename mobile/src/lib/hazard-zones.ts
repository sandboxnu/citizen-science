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

function pointInRing(point: LatLng, ring: LatLng[]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].longitude;
    const yi = ring[i].latitude;
    const xj = ring[j].longitude;
    const yj = ring[j].latitude;

    const intersects =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude <
        ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;

    if (intersects) inside = !inside;
  }

  return inside;
}

function isPointInHazardPolygon(point: LatLng, polygon: HazardPolygon): boolean {
  if (!pointInRing(point, polygon.outer)) return false;

  return !polygon.holes.some((hole) => pointInRing(point, hole));
}

const EARTH_RADIUS_METERS = 6_371_000;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

function toLocalMeters(point: LatLng, origin: LatLng): { x: number; y: number } {
  const cosLat = Math.cos(toRadians(origin.latitude));
  return {
    x: toRadians(point.longitude - origin.longitude) * cosLat * EARTH_RADIUS_METERS,
    y: toRadians(point.latitude - origin.latitude) * EARTH_RADIUS_METERS,
  };
}

function distanceToSegmentMeters(center: LatLng, a: LatLng, b: LatLng): number {
  const p1 = toLocalMeters(a, center);
  const p2 = toLocalMeters(b, center);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lengthSquared = dx * dx + dy * dy;

  const t =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, -(p1.x * dx + p1.y * dy) / lengthSquared));

  return Math.hypot(p1.x + t * dx, p1.y + t * dy);
}

function isRingWithinRadius(center: LatLng, radiusMeters: number, ring: LatLng[]): boolean {
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    if (distanceToSegmentMeters(center, ring[j], ring[i]) <= radiusMeters) return true;
  }
  return false;
}


export function isLocationInHazardPolygon(
  center: LatLng,
  radiusMeters: number,
  polygon: HazardPolygon
): boolean {
  if (isPointInHazardPolygon(center, polygon)) return true;
  if (radiusMeters <= 0) return false;

  return [polygon.outer, ...polygon.holes].some((ring) =>
    isRingWithinRadius(center, radiusMeters, ring)
  );
}

export function isLocationInHazardZone(
  center: LatLng,
  accuracyMeters: number,
  polygons: HazardPolygon[]
): boolean {
  return polygons.some((polygon) =>
    isLocationInHazardPolygon(center, accuracyMeters, polygon)
  );
}
