export type DisasterType = "flooding" | "earthquake" | "forest_fire";

export type SubmitDuringDisasterReportInput = {
  userId: string;
  disasterType: DisasterType; // defaults to "flooding" in the UI, required here
  latitude: number;
  longitude: number;
  observedAt: string; // auto-captured, user-editable in the UI
  photoUrls: string[]; // already-uploaded Storage URLs and locations pairs
  description?: string;
};

// TODO: implement
export async function submitDuringDisasterReport(
  input: SubmitDuringDisasterReportInput
): Promise<void> {}
