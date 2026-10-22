import type { NwsAlert } from '@/lib/nws-alerts';

// What the alert popup shows. Sections the alert has no text for are
// undefined so the popup can hide them.
export type AlertDetails = {
  title: string;
  severity: string;
  // Whether the event is happening now: it has started and hasn't ended.
  isActive: boolean;
  lastUpdated: string;
  startDate?: string;
  endDate?: string;
  impacts?: string;
  instruction?: string;
  additionalDetails?: string;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function parseDate(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// "9:35PM"
function formatTime(date: Date): string {
  const hours = date.getHours() % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}${date.getHours() < 12 ? 'AM' : 'PM'}`;
}

// "September 16 at 12:00AM"
function formatDateTime(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getDate()} at ${formatTime(date)}`;
}

// NWS hard-wraps text at ~70 columns. Rejoin wrapped lines into sentences but
// keep paragraph breaks and "- " / "* " list items on their own lines.
export function unwrapNwsText(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) =>
      paragraph
        .trim()
        .replace(/[ \t]*\n[ \t]*(?![-*] )/g, ' ')
        .replace(/[ \t]*\n[ \t]*/g, '\n')
    )
    .filter(Boolean)
    .join('\n\n');
}

const orUndefined = (text: string | undefined) => (text ? text : undefined);

// Flood Warnings and Watches use "* IMPACTS..." style bullet sections.
function parseBulletSections(description: string): Map<string, string> {
  const sections = new Map<string, string>();
  const bullet = /^\* ([A-Z][A-Z ]+)\.\.\.([\s\S]*?)(?=^\* [A-Z][A-Z ]+\.\.\.|(?![\s\S]))/gm;
  for (const [, label, body] of description.matchAll(bullet)) {
    sections.set(label.trim(), unwrapNwsText(body));
  }
  return sections;
}

// Flash Flood Warnings put impacts in an "IMPACT..." paragraph and the rest of
// the description in free-form text.
function parseFlashFloodDescription(description: string) {
  const impact = /^IMPACT\.\.\.([\s\S]*?)(?=\n\s*\n|(?![\s\S]))/m.exec(description);
  if (!impact) return undefined;

  const rest = description
    .replace(impact[0], '')
    // Leading product code line, e.g. "FFWRNK".
    .replace(/^\s*[A-Z0-9]{4,9}\s*\n/, '');
  return { impacts: unwrapNwsText(impact[1]), additionalDetails: unwrapNwsText(rest) };
}

function parseDescription(description: string | undefined) {
  if (!description) return {};

  const bullets = parseBulletSections(description);
  if (bullets.has('IMPACTS') || bullets.has('ADDITIONAL DETAILS')) {
    return {
      impacts: orUndefined(bullets.get('IMPACTS')),
      additionalDetails: orUndefined(bullets.get('ADDITIONAL DETAILS')),
    };
  }

  const flashFlood = parseFlashFloodDescription(description);
  if (flashFlood) {
    return {
      impacts: orUndefined(flashFlood.impacts),
      additionalDetails: orUndefined(flashFlood.additionalDetails),
    };
  }

  return { additionalDetails: orUndefined(unwrapNwsText(description)) };
}

export function toAlertDetails(alert: NwsAlert, now: number = Date.now()): AlertDetails {
  const sent = parseDate(alert.sent);
  const start = parseDate(alert.onset ?? alert.effective);
  const end = parseDate(alert.ends ?? alert.expires);
  const isActive = (!start || start.getTime() <= now) && (!end || end.getTime() > now);

  return {
    title: alert.event,
    severity: alert.severity,
    isActive,
    lastUpdated: sent ? formatTime(sent) : '',
    startDate: start && formatDateTime(start),
    endDate: end && formatDateTime(end),
    instruction: orUndefined(alert.instruction && unwrapNwsText(alert.instruction)),
    ...parseDescription(alert.description),
  };
}
