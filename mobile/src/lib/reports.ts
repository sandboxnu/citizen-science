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
