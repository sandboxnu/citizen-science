import type { ImagePickerAsset } from 'expo-image-picker';

export type Coordinates = { latitude: number; longitude: number };

// EXIF GPS values arrive as decimal numbers on iOS but may be "deg/1,min/1,sec/100" rationals on Android.
const parseCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parts = value.split(',').map((part) => {
    const [num, den = '1'] = part.trim().split('/');
    return Number(num) / Number(den);
  });
  if (parts.some((n) => !Number.isFinite(n))) return null;

  const [deg = 0, min = 0, sec = 0] = parts;
  return deg + min / 60 + sec / 3600;
};

const signed = (value: number | null, ref: unknown, negativeRef: 'S' | 'W') => {
  if (value === null) return null;
  return typeof ref === 'string' && ref.toUpperCase() === negativeRef ? -Math.abs(value) : value;
};

export function getPhotoCoordinates(asset: ImagePickerAsset): Coordinates | null {
  const exif = asset.exif;
  if (!exif) return null;

  // iOS nests GPS under "{GPS}"; Android keeps flat "GPS*" keys.
  const gps = exif['{GPS}'];
  const latitude = gps
    ? signed(parseCoordinate(gps.Latitude), gps.LatitudeRef, 'S')
    : signed(parseCoordinate(exif.GPSLatitude), exif.GPSLatitudeRef, 'S');
  const longitude = gps
    ? signed(parseCoordinate(gps.Longitude), gps.LongitudeRef, 'W')
    : signed(parseCoordinate(exif.GPSLongitude), exif.GPSLongitudeRef, 'W');

  if (latitude === null || longitude === null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { latitude, longitude };
}

// EXIF dates look like "2026:11:08 14:00:06" in the camera's local time.
export function getPhotoTakenAt(asset: ImagePickerAsset): Date | null {
  const exif = asset.exif;
  if (!exif) return null;

  const raw: unknown = exif['{Exif}']?.DateTimeOriginal ?? exif.DateTimeOriginal ?? exif.DateTime;
  if (typeof raw !== 'string') return null;

  const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;

  const [, y, mo, d, h, mi, s] = match.map(Number);
  const date = new Date(y, mo - 1, d, h, mi, s);
  return Number.isNaN(date.getTime()) ? null : date;
}
