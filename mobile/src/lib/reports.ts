import { auth, firestore, storage } from '@/lib/firebase';
import { GeoPoint, Timestamp, addDoc, collection, serverTimestamp } from '@react-native-firebase/firestore';
import { deleteObject, getDownloadURL, putFile, ref } from '@react-native-firebase/storage';

export type DisasterType = "flooding" | "earthquake" | "forest_fire";

export type LocationSource = "photo" | "current" | "edited";

export type ObservedAtSource = "photo" | "current" | "edited";

export type SubmitDuringDisasterReportInput = {
  userId: string;
  disasterType: DisasterType; // defaults to "flooding" in the UI, required here
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  observedAt: string; // auto-captured, user-editable in the UI
  observedAtSource: ObservedAtSource;
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
  latitude: number;
  longitude: number;
  locationSource: LocationSource;
  observedAt: string; // auto-captured, user-editable in the UI
  observedAtSource: ObservedAtSource;
  damageRating: number; // required, 1-5
  description?: string; // optional
  photoUrls: { url: string; latitude: number; longitude: number }[]; // already-uploaded Storage URLs and locations, multiple per concern
};

export type SubmitPostDisasterReportInput = {
  userId: string;
  disasterType: DisasterType;
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
    const concerns = input.concerns.map((c) => {
      const observedAt = new Date(c.observedAt);
      if (Number.isNaN(observedAt.getTime())) {
        throw new Error(`Invalid observedAt for concern ${c.type}: ${c.observedAt}`);
      }
      return {
        type: c.type,
        location: new GeoPoint(c.latitude, c.longitude),
        locationSource: c.locationSource,
        observedAt: Timestamp.fromDate(observedAt),
        observedAtSource: c.observedAtSource,
        damageRating: c.damageRating,
        ...(c.description !== undefined && { description: c.description }),
        photoUrls: c.photoUrls.map((p) => ({
          url: p.url,
          location: new GeoPoint(p.latitude, p.longitude),
        })),
      };
    });
    const ref = await addDoc(collection(firestore, 'reports'), {
      userId: input.userId,
      disasterType: input.disasterType,
      createdAt: serverTimestamp(),
      concerns,
    });
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
    locationSource: input.locationSource,
    observedAt: Timestamp.fromDate(observedAt),
    observedAtSource: input.observedAtSource,
    createdAt: serverTimestamp(), 
    photos: input.photoUrls.map((p) => ({
      url: p.url,
      location: new GeoPoint(p.latitude, p.longitude),
    })),
    ...(input.description !== undefined && { description: input.description }),
  });
}



const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
};

export type UploadedReportPhoto = { url: string; path: string };

// Uploads a local photo to reports/{uid}/ in Storage and returns its download URL, plus its path so a failed
// submission can delete it again.
export async function uploadReportPhoto(userId: string, localUri: string): Promise<UploadedReportPhoto> {
  const extension = localUri.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[extension] ?? 'image/jpeg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension in CONTENT_TYPES ? extension : 'jpg'}`;
  const path = `reports/${userId}/${fileName}`;
  const photoRef = ref(storage, path);
  await putFile(photoRef, localUri, { contentType });
  return { url: await getDownloadURL(photoRef), path };
}

export async function deleteReportPhotos(paths: string[]): Promise<void> {
  await Promise.allSettled(paths.map((path) => deleteObject(ref(storage, path))));
}
