/** Realm clock used as the "server time" hint. The guild site already treated this as Mountain Time. */
export const SERVER_TIME_ZONE = 'America/Denver';

export const SCHEDULE_MAX_AHEAD_MS = 90 * 24 * 60 * 60 * 1000;
export const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Parts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday?: string;
  tz?: string;
};

function formatParts(date: Date, timeZone: string, withName = false): Parts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    ...(withName ? { timeZoneName: 'short' as const } : {}),
  });
  const bag: Record<string, string> = {};
  for (const part of dtf.formatToParts(date)) bag[part.type] = part.value;
  let hour = Number(bag.hour);
  if (hour === 24) hour = 0;
  return {
    year: Number(bag.year),
    month: Number(bag.month),
    day: Number(bag.day),
    hour,
    minute: Number(bag.minute),
    second: Number(bag.second),
    weekday: bag.weekday,
    tz: bag.timeZoneName,
  };
}

function tzOffsetMs(timeZone: string, utcMs: number): number {
  const parts = formatParts(new Date(utcMs), timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - utcMs;
}

function sameWall(parts: Parts, year: number, month: number, day: number, hour: number, minute: number): boolean {
  return parts.year === year && parts.month === month && parts.day === day && parts.hour === hour && parts.minute === minute;
}

/** Convert a wall-clock date and time in `timeZone` to a UTC instant. */
export function zonedWallTimeToUtc(date: string, time: string, timeZone: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(0);
  } catch {
    return null;
  }

  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const offset = tzOffsetMs(timeZone, utcGuess);
  const first = utcGuess - offset;
  const secondOffset = tzOffsetMs(timeZone, first);
  const second = utcGuess - secondOffset;
  if (sameWall(formatParts(new Date(first), timeZone), year, month, day, hour, minute)) return new Date(first);
  if (sameWall(formatParts(new Date(second), timeZone), year, month, day, hour, minute)) return new Date(second);
  return null;
}

export function formatInstant(iso: string | Date, timeZone: string): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  if (Number.isNaN(date.getTime())) return '';
  const parts = formatParts(date, timeZone, true);
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const ampm = parts.hour < 12 ? 'AM' : 'PM';
  const minute = String(parts.minute).padStart(2, '0');
  const monthName = MONTHS[parts.month - 1] ?? '';
  return `${parts.weekday}, ${monthName} ${parts.day}, ${hour12}:${minute} ${ampm} ${parts.tz ?? ''}`.replace(/\s+/g, ' ').trim();
}

export function formatRange(startIso: string, endIso: string | null | undefined, timeZone: string): string {
  const start = formatInstant(startIso, timeZone);
  if (!endIso) return start;
  const endDate = new Date(endIso);
  if (Number.isNaN(endDate.getTime())) return start;
  const startParts = formatParts(new Date(startIso), timeZone);
  const endParts = formatParts(endDate, timeZone);
  const sameDay = startParts.year === endParts.year && startParts.month === endParts.month && startParts.day === endParts.day;
  if (!sameDay) return `${start} – ${formatInstant(endDate, timeZone)}`;
  const hour12 = endParts.hour % 12 === 0 ? 12 : endParts.hour % 12;
  const ampm = endParts.hour < 12 ? 'AM' : 'PM';
  const minute = String(endParts.minute).padStart(2, '0');
  return `${start} – ${hour12}:${minute} ${ampm}`;
}

export function localFieldsFromInstant(iso: string, timeZone: string): { date: string; time: string } {
  const parts = formatParts(new Date(iso), timeZone);
  return {
    date: `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`,
    time: `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`,
  };
}

export function serverClock(iso: string | Date): { day: string; time: string } {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  const parts = formatParts(date, SERVER_TIME_ZONE);
  const hour12 = parts.hour % 12 === 0 ? 12 : parts.hour % 12;
  const ampm = parts.hour < 12 ? 'AM' : 'PM';
  const minute = String(parts.minute).padStart(2, '0');
  return { day: (parts.weekday ?? 'Sat').slice(0, 3), time: `${hour12}:${minute} ${ampm}` };
}

export function discordTimestamp(iso: string | Date, style: 'F' | 'R' = 'F'): string {
  const ms = typeof iso === 'string' ? new Date(iso).getTime() : iso.getTime();
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

export function resolveSchedule(input: {
  date: string;
  start: string;
  end?: string | null;
  timeZone: string;
  now?: number;
}): { ok: true; startsAt: Date; endsAt: Date } | { ok: false; error: string } {
  const now = input.now ?? Date.now();
  const startsAt = zonedWallTimeToUtc(input.date, input.start, input.timeZone);
  if (!startsAt) return { ok: false, error: 'Enter a valid date and start time.' };
  if (startsAt.getTime() < now - 60 * 60 * 1000) return { ok: false, error: 'That start time has already passed.' };
  if (startsAt.getTime() > now + SCHEDULE_MAX_AHEAD_MS) return { ok: false, error: 'Schedule a run within the next 90 days.' };

  let endsAt: Date;
  if (input.end) {
    const parsed = zonedWallTimeToUtc(input.date, input.end, input.timeZone);
    if (!parsed) return { ok: false, error: 'Enter a valid end time.' };
    endsAt = parsed.getTime() <= startsAt.getTime()
      ? new Date(parsed.getTime() + 24 * 60 * 60 * 1000)
      : parsed;
  } else {
    endsAt = new Date(startsAt.getTime() + DEFAULT_DURATION_MS);
  }

  if (endsAt.getTime() - startsAt.getTime() > 18 * 60 * 60 * 1000) {
    return { ok: false, error: 'Keep the run under 18 hours.' };
  }
  return { ok: true, startsAt, endsAt };
}
