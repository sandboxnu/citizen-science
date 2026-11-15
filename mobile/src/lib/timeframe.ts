// Timeframe filter logic for past 7 days, past 30 days, past 60 days, or a custom date range

export type TimeframePreset = 'past7' | 'past30' | 'past60';

export type Timeframe =
  | { kind: TimeframePreset }
  | { kind: 'custom'; start: Date; end: Date };

export const DEFAULT_TIMEFRAME: Timeframe = { kind: 'past30' };

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESET_DAYS: Record<TimeframePreset, number> = { past7: 7, past30: 30, past60: 60 };

export const PRESET_LABELS: Record<TimeframePreset, string> = {
  past7: 'Past 7 days',
  past30: 'Past 30 days',
  past60: 'Past 60 days',
};

export const isDefaultTimeframe = (timeframe: Timeframe) => timeframe.kind === 'past30';

export const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

export function timeframeRange(timeframe: Timeframe, now = new Date()): { start: number; end: number } {
  if (timeframe.kind === 'custom') {
    return { start: startOfDay(timeframe.start).getTime(), end: endOfDay(timeframe.end).getTime() };
  }
  return { start: now.getTime() - PRESET_DAYS[timeframe.kind] * DAY_MS, end: Infinity };
}

// Keeps alerts that were issued inside the selected window.
export function isInTimeframe(sent: string, timeframe: Timeframe, now = new Date()): boolean {
  const sentAt = Date.parse(sent);
  if (Number.isNaN(sentAt)) return true;
  const { start, end } = timeframeRange(timeframe, now);
  return sentAt >= start && sentAt < end;
}

const SHORT_DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function timeframeLabel(timeframe: Timeframe): string {
  if (timeframe.kind === 'custom') {
    return `${SHORT_DATE.format(timeframe.start)} - ${SHORT_DATE.format(timeframe.end)}`;
  }
  return PRESET_LABELS[timeframe.kind];
}

const pad = (value: number) => String(value).padStart(2, '0');

export const formatDateInput = (date: Date) =>
  `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`;

// Parses a complete MM/DD/YYYY string; returns null for partial or impossible dates.
export function parseDateInput(text: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!match) return null;
  const [month, day, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(year, month - 1, day);
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return valid ? date : null;
}

const SEGMENT_PLACEHOLDERS = ['MM', 'DD', 'YYYY'];
const SEGMENT_LIMITS = [2, 2, 4];

export function maskDateInput(text: string): string {
  if (text.includes('/')) {
    const parts = text.split('/');
    if (parts.length === 3) {
      const cleaned = parts.map((part, i) => part.replace(/\D/g, '').slice(0, SEGMENT_LIMITS[i]));
      // Drop trailing empty segments so normal backspacing at the end still works.
      let last = cleaned.length;
      while (last > 0 && !cleaned[last - 1]) last--;
      return cleaned
        .slice(0, last)
        .map((part, i) => part || SEGMENT_PLACEHOLDERS[i])
        .join('/');
    }
  }

  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}
