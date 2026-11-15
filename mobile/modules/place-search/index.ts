import { requireOptionalNativeModule } from 'expo';

export type PlaceSuggestion = { id: string; title: string; subtitle: string };

export type ResolvedSuggestion = {
  latitude: number;
  longitude: number;
  isPointOfInterest: boolean;
  hasStreet: boolean;
  hasCity: boolean;
  hasRegion: boolean;
};

type PlaceSearchNativeModule = {
  autocomplete(
    query: string,
    latitude: number,
    longitude: number,
    radiusMeters: number
  ): Promise<PlaceSuggestion[]>;
  resolve(id: string): Promise<ResolvedSuggestion | null>;
};

// Apple MapKit search. null where the native module isn't built in (Android, web).
export default requireOptionalNativeModule<PlaceSearchNativeModule>('PlaceSearch');
