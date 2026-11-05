import { auth, firestore } from '@/lib/firebase';
import { GeoPoint, Timestamp, addDoc, collection } from '@react-native-firebase/firestore';

export type DisasterType = "flooding" | "earthquake" | "forest_fire";

export type SubmitDuringDisasterReportInput = {
  userId: string;
  disasterType: DisasterType; // defaults to "flooding" in the UI, required here
  latitude: number;
  longitude: number;
  observedAt: string; // auto-captured, user-editable in the UI
  photoUrls: { url: string; latitude: number; longitude: number }[]; // already-uploaded Storage URLs and locations 
  description?: string;
};


export const KNOWN_CONCERN_TYPES = [
  "high_waterline",
  "standing_water",
  "impassable_roadway",
  "building_water_damage",
  "infrastructure_damage",
  "crop_damage",
  "power_utility_damage",
  "submerged_vehicle",
] as const;

export type KnownConcernType = (typeof KNOWN_CONCERN_TYPES)[number];

export type ConcernType = KnownConcernType | (string & {});

export const isKnownConcernType = (type: string): type is KnownConcernType =>
  (KNOWN_CONCERN_TYPES as readonly string[]).includes(type);

// Turns user-entered text into a concern type.
export const toConcernType = (text: string): ConcernType =>
  text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

export type Concern = {
  type: ConcernType;
  damageRating: number; // required, 1-5
  description?: string; // optional
  photoUrls: { url: string; latitude: number; longitude: number }[]; // already-uploaded Storage URLs and locations, multiple per concern
};

export type SubmitPostDisasterReportInput = {
  userId: string;
  disasterType: DisasterType;
  latitude: number;
  longitude: number;
  observedAt: string; // auto-captured, user-editable in the UI
  concerns: Concern[];
};

export async function submitPostDisasterReport(
  input: SubmitPostDisasterReportInput
): Promise<string> {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('Must be signed in to submit a report');
    }
    if (input.userId !== currentUser.uid) {
      throw new Error('userId does not match the signed-in user');
    }
    const observedAt = new Date(input.observedAt);
    if (Number.isNaN(observedAt.getTime())) {
      throw new Error(`Invalid observedAt: ${input.observedAt}`);
    }
    const ref = await addDoc(collection(firestore, 'reports'), {
    userId: input.userId,
    disasterType: input.disasterType,
    location: new GeoPoint(input.latitude, input.longitude),
    observedAt: Timestamp.fromDate(observedAt),
    concerns: input.concerns.map((c) => ({
        type: c.type,
        damageRating: c.damageRating,
        ...(c.description !== undefined && { description: c.description }),
        photoUrls: c.photoUrls.map((p) => ({
      url: p.url,
      location: new GeoPoint(p.latitude, p.longitude)
      }))
    }))
  })
  return ref.id;
}


export async function submitDuringDisasterReport(
  input: SubmitDuringDisasterReportInput
): Promise<void> {
  const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Must be signed in to submit a report');
    }
    if (input.userId !== currentUser.uid) {
      throw new Error('userId does not match the signed-in user');
    }
  const observedAt = new Date(input.observedAt);
  if (Number.isNaN(observedAt.getTime())) {
    throw new Error(`Invalid observedAt: ${input.observedAt}`);
  }
  await addDoc(collection(firestore, 'reports'), {
    userId: input.userId, 
    disasterType: input.disasterType,
    location: new GeoPoint(input.latitude, input.longitude),
    observedAt: Timestamp.fromDate(observedAt),
    photos: input.photoUrls.map((p) => ({
      url: p.url,
      location: new GeoPoint(p.latitude, p.longitude),
    })),
    ...(input.description !== undefined && { description: input.description }),
  });
}

