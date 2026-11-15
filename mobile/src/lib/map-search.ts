import * as Location from 'expo-location';

import PlaceSearch from '../../modules/place-search';
import type { LatLng } from '@/lib/hazard-zones';

const MAX_PLACE_RESULTS = 4;
// Geocoder hits to reverse-geocode and fuzzy-check before keeping the best few.
const MAX_GEOCODE_CANDIDATES = 5;
// MapKit ranks suggestions inside this radius of the user first; farther ones still appear.
const SEARCH_BIAS_RADIUS_METERS = 50_000;

// How specific a result is, from the address fields the query matched.
type PlaceKind = 'address' | 'postalCode' | 'city' | 'region' | 'country';

// A place to drop the pin on, with the map span (degrees) that frames it.
export type PinnedPlace = {
  id: string;
  name: string;
  coordinate: LatLng;
  zoomDelta: number;
};

// A row in the results dropdown. MapKit suggestions only get a coordinate once tapped, so
// `resolve` looks it up (null if the place can't be found).
export type PlaceResult = {
  id: string;
  name: string;
  subtitle?: string;
  resolve: () => Promise<PinnedPlace | null>;
};

// Map span (degrees) to show when jumping to a result of each kind.
const PLACE_ZOOM_DELTA: Record<PlaceKind, number> = {
  address: 0.02,
  postalCode: 0.08,
  city: 0.15,
  region: 5,
  country: 30,
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

// iOS reverse geocoding gives US states as postal codes ("MA"); this lets "Massachusetts" match.
const US_STATES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', PR: 'Puerto Rico', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia',
  WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
};

// Street-type spellings folded together so "Main Street" matches "Main St".
const ABBREVIATIONS: Record<string, string> = {
  street: 'st', avenue: 'ave', av: 'ave', road: 'rd', boulevard: 'blvd', drive: 'dr', lane: 'ln',
  court: 'ct', place: 'pl', square: 'sq', terrace: 'ter', parkway: 'pkwy', highway: 'hwy',
  north: 'n', south: 's', east: 'e', west: 'w', saint: 'st', mount: 'mt', fort: 'ft',
};

function tokenize(text: string | null | undefined): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((token) => ABBREVIATIONS[token] ?? token);
}

function levenshtein(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[b.length];
}

// Typos allowed per query word: none for short words or numbers, more for longer words.
function allowedTypos(token: string): number {
  if (token.length <= 3 || /\d/.test(token)) return 0;
  return token.length <= 6 ? 1 : 2;
}

// A query word matches a place word if it's a typo of the word, or of its start (still typing).
function tokenMatches(queryToken: string, placeToken: string): boolean {
  if (placeToken.startsWith(queryToken)) return true;
  const typos = allowedTypos(queryToken);
  if (typos === 0) return false;
  return (
    levenshtein(queryToken, placeToken) <= typos ||
    levenshtein(queryToken, placeToken.slice(0, queryToken.length)) <= typos
  );
}

// Address fields grouped by how specific they are, most specific first.
function fieldTokens(address: Location.LocationGeocodedAddress): [PlaceKind, string[]][] {
  const stateName = address.region ? US_STATES[address.region.toUpperCase()] : undefined;
  return [
    ['address', [address.name, address.streetNumber, address.street].flatMap(tokenize)],
    ['postalCode', tokenize(address.postalCode)],
    ['city', [address.city, address.district, address.subregion].flatMap(tokenize)],
    ['region', [address.region, stateName].flatMap(tokenize)],
    ['country', [address.country, address.isoCountryCode].flatMap(tokenize)],
  ];
}

// House number the query starts with ("31 Mohave Rd" -> "31").
function leadingHouseNumber(query: string): string | undefined {
  return /^\s*(\d+[a-z]?)\b/i.exec(query)?.[1].toLowerCase();
}

// The most specific kind the query names, or null if some query word matches nothing in
// the address (the geocoder's loose guess, e.g. "Flood" -> Pamplin, VA). The house number is
// skipped when the address has a street: reverse geocoding snaps to the nearest known number
// ("31 Mohave Rd" comes back as "3 Mohave Rd"), so it can't be checked.
function matchKind(
  queryTokens: string[],
  houseNumber: string | undefined,
  address: Location.LocationGeocodedAddress
): PlaceKind | null {
  const fields = fieldTokens(address);
  const tokens = houseNumber && address.street ? queryTokens.filter((t) => t !== houseNumber) : queryTokens;
  let best: number | null = null;
  for (const queryToken of tokens) {
    const index = fields.findIndex(([, tokens]) => tokens.some((t) => tokenMatches(queryToken, t)));
    if (index === -1) return null;
    best = best === null ? index : Math.min(best, index);
  }
  return best === null ? null : fields[best][0];
}

function describe(
  kind: PlaceKind,
  address: Location.LocationGeocodedAddress,
  query: string,
  houseNumber: string | undefined
) {
  const city = address.city ?? address.subregion;
  const region = address.region;
  const stateName = region ? (US_STATES[region.toUpperCase()] ?? region) : undefined;
  const join = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(', ') || undefined;
  switch (kind) {
    case 'address': {
      // Show the number that was searched, not the nearest one reverse geocoding snapped to.
      const name = houseNumber && address.street ? `${houseNumber} ${address.street}` : address.name;
      return { name: name ?? query, subtitle: join(city, region) };
    }
    case 'postalCode':
      return { name: address.postalCode ?? query, subtitle: join(city, region) };
    case 'city':
      return { name: city ?? query, subtitle: join(region, address.country) };
    case 'region':
      return { name: stateName ?? query, subtitle: join(address.country) };
    case 'country':
      return { name: address.country ?? query, subtitle: undefined };
  }
}

// Places matching `query`, nearby ones first. Uses Apple Maps search where it's built in (iOS),
// which lists every match ("31 Mohave Rd" in Worcester and Medfield) plus businesses and
// landmarks; elsewhere falls back to the platform geocoder. Never throws.
export async function searchPlaces(query: string, origin: LatLng): Promise<PlaceResult[]> {
  return PlaceSearch ? searchMapKit(PlaceSearch, query, origin) : searchGeocoder(query, origin);
}

async function searchMapKit(
  mapKit: NonNullable<typeof PlaceSearch>,
  query: string,
  origin: LatLng
): Promise<PlaceResult[]> {
  try {
    const suggestions = await mapKit.autocomplete(
      query,
      origin.latitude,
      origin.longitude,
      SEARCH_BIAS_RADIUS_METERS
    );
    return suggestions.slice(0, MAX_PLACE_RESULTS).map(({ id, title, subtitle }) => ({
      id,
      name: title,
      subtitle: subtitle.replace(/,?\s*United States$/, '') || undefined,
      resolve: async () => {
        const place = await mapKit.resolve(id).catch(() => null);
        if (!place) return null;
        const kind: PlaceKind =
          place.isPointOfInterest || place.hasStreet
            ? 'address'
            : place.hasCity
              ? 'city'
              : place.hasRegion
                ? 'region'
                : 'country';
        return {
          id,
          name: title,
          coordinate: { latitude: place.latitude, longitude: place.longitude },
          zoomDelta: PLACE_ZOOM_DELTA[kind],
        };
      },
    }));
  } catch {
    return [];
  }
}

// Platform geocoder (CLGeocoder on iOS), closest to `origin` first. Hits that don't fuzzy-match
// the query are dropped, and each is labeled at the level the query names (a city search shows
// the city, not a street near its center).
async function searchGeocoder(query: string, origin: LatLng): Promise<PlaceResult[]> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const houseNumber = leadingHouseNumber(query);
  try {
    const hits = (await Location.geocodeAsync(query))
      .sort((a, b) => distanceKm(origin, a) - distanceKm(origin, b))
      .slice(0, MAX_GEOCODE_CANDIDATES);
    const candidates = await Promise.all(
      hits.map(async ({ latitude, longitude }, i): Promise<PinnedPlace & { subtitle?: string } | null> => {
        const [address] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
        if (!address) return null;
        const kind = matchKind(queryTokens, houseNumber, address);
        if (!kind) return null;
        return {
          id: `${latitude},${longitude},${i}`,
          ...describe(kind, address, query.trim(), houseNumber),
          coordinate: { latitude, longitude },
          zoomDelta: PLACE_ZOOM_DELTA[kind],
        };
      })
    );
    const seen = new Set<string>();
    return candidates
      .filter((place): place is NonNullable<typeof place> => {
        if (!place) return false;
        const key = `${place.name}|${place.subtitle ?? ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_PLACE_RESULTS)
      .map(({ subtitle, ...pinned }) => ({
        id: pinned.id,
        name: pinned.name,
        subtitle,
        resolve: async () => pinned,
      }));
  } catch {
    return [];
  }
}
