import { requireOptionalNativeModule } from 'expo';

export type PlaceSuggestion = { id: string; title: string; subtitle: string };

export type ResolvedSuggestion = {
  latitude: number;
  longitude: number;
  // How specific the place is: a street address or business, a city, a state, or a country.
  kind: 'address' | 'city' | 'region' | 'country';
};

type PlaceSearchNativeModule = {
  /**
   * Call as the user types. Matching places as text only (no coordinates); nearby ones first.
   * [] if nothing matches; rejects if the search fails.
   */
  autocomplete(
    query: string,
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<PlaceSuggestion[]>;

  /**
   * Call once, for the tapped row's `id` from `autocomplete`. Its coordinate and kind.
   * null if not found; rejects if the lookup fails.
   */
  resolve(id: string): Promise<ResolvedSuggestion | null>;
};

// Apple MapKit search. null where the native module isn't built in (Android, web).
export default requireOptionalNativeModule<PlaceSearchNativeModule>('PlaceSearch');
