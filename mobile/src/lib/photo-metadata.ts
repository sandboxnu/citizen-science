import type { ImagePickerAsset } from 'expo-image-picker';

export type Coordinates = { latitude: number; longitude: number };

// EXIF GPS values arrive as decimal numbers on iOS but may be "deg/1,min/1,sec/100" rationals on Android.
const parseCoordinate = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parts = value.split(',').map((part) => {
    const [num, den = '1'] = part.split('/').map((s) => s.trim());
    // Number('') is 0, so a blank component would otherwise read as a real coordinate of 0.
    if (num === '' || den === '') return NaN;
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

const MINUTE = 60_000;

// Reads EXIF's "YYYY:MM:DD HH:MM:SS" as if it were UTC, giving the clock time's milliseconds without any time zone.
const parseClockTime = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, mo, d, h, mi, s] = match.map(Number);
  const ms = Date.UTC(y, mo - 1, d, h, mi, s);
  return Number.isNaN(ms) ? null : ms;
};

// EXIF offsets look like "-05:00": how far the camera's clock was from UTC, in minutes.
const parseOffset = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^([+-])(\d{2}):?(\d{2})$/);
  if (!match) return null;
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === '-' ? -minutes : minutes;
};

// GPS time is UTC, as "HH:MM:SS" (possibly with fractional seconds) or Android's "h/1,m/1,s/100" rationals.
const parseGpsTime = (value: unknown): number | null => {
  if (typeof value !== 'string') return null;
  const parts = value.split(/[:,]/).map((part) => {
    const [num, den = '1'] = part.trim().split('/');
    return Number(num) / Number(den);
  });
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  const [h, m, s] = parts;
  return ((h * 60 + m) * 60 + s) * 1000;
};

// The camera's UTC offset, worked out from the GPS fix's UTC time. The fix can be a little older than the photo,
// so round to the nearest 15 minutes (every real time zone is a multiple of that).
const offsetFromGps = (clockTime: number, gpsDate: unknown, gpsTime: unknown): number | null => {
  if (typeof gpsDate !== 'string') return null;
  const day = parseClockTime(`${gpsDate.trim()} 00:00:00`);
  const time = parseGpsTime(gpsTime);
  if (day === null || time === null) return null;
  const offset = Math.round((clockTime - (day + time)) / MINUTE / 15) * 15;
  return Math.abs(offset) <= 14 * 60 ? offset : null;
};

// EXIF dates look like "2026:11:08 14:00:06" in the camera's local time, with no time zone. Work out the actual
// moment from the photo's own offset (iOS) or its GPS UTC time (Android doesn't pass offsets through). Only if
// neither is there, fall back to reading it in the device's current time zone.
export function getPhotoTakenAt(asset: ImagePickerAsset): Date | null {
  const exif = asset.exif;
  if (!exif) return null;

  const exifDict = exif['{Exif}'];
  const original = exifDict?.DateTimeOriginal ?? exif.DateTimeOriginal;
  const clockTime = parseClockTime(original ?? exif.DateTime);
  if (clockTime === null) return null;

  // Use the offset that belongs to whichever date we read.
  const offset =
    (original !== undefined
      ? parseOffset(exifDict?.OffsetTimeOriginal ?? exif.OffsetTimeOriginal)
      : parseOffset(exif['{TIFF}']?.OffsetTime ?? exifDict?.OffsetTime ?? exif.OffsetTime)) ??
    (exif['{GPS}']
      ? offsetFromGps(clockTime, exif['{GPS}'].DateStamp, exif['{GPS}'].TimeStamp)
      : offsetFromGps(clockTime, exif.GPSDateStamp, exif.GPSTimeStamp));

  if (offset !== null) return new Date(clockTime - offset * MINUTE);

  // No time zone information: assume the device's current zone.
  const c = new Date(clockTime);
  return new Date(c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate(), c.getUTCHours(), c.getUTCMinutes(), c.getUTCSeconds());
}
