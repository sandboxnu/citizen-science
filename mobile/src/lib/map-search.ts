import * as Location from 'expo-location';

import type { LatLng } from '@/lib/hazard-zones';

const MAX_PLACE_RESULTS = 2;

export type PlaceResult = {
  id: string;
  name: string;
  subtitle?: string;
  coordinate: LatLng;
};

const EARTH_RADIUS_KM = 6371;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

// Great-circle distance in km.
export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Addresses and places via the platform geocoder (CLGeocoder on iOS), closest to
// `origin` first. Never throws.
export async function searchPlaces(query: string, origin: LatLng): Promise<PlaceResult[]> {
  try {
    const hits = (await Location.geocodeAsync(query))
      .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
      .slice(0, MAX_PLACE_RESULTS);
    return await Promise.all(
      hits.map(async ({ latitude, longitude }, i) => {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
        const subtitle = [address?.city ?? address?.subregion, address?.region].filter(Boolean).join(', ');
        return {
          id: `${latitude},${longitude},${i}`,
          name: address?.name ?? query.trim(),
          subtitle: subtitle || undefined,
          coordinate: { latitude, longitude },
        };
      })
    );
  } catch {
    return [];
  }
}
