/**
 * Helpers for Asia/Ho_Chi_Minh (ICT) calendar logic. ICT is a fixed UTC+7
 * offset with no daylight saving, so a simple offset shift is exact.
 */

const ICT_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Calendar date in ICT as a `YYYY-MM-DD` string. */
export function ictDateString(date: Date = new Date()): string {
  return new Date(date.getTime() + ICT_OFFSET_MS).toISOString().slice(0, 10);
}

/** Whole-day difference (a - b) between two `YYYY-MM-DD` ICT date strings. */
export function ictDayDiff(a: string, b: string): number {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  return Math.round((da - db) / 86_400_000);
}

/** `YYYY-MM-DD` of the Monday starting the ICT week that contains `date`. */
export function ictWeekStartMonday(date: Date = new Date()): string {
  const ict = new Date(date.getTime() + ICT_OFFSET_MS);
  const dow = ict.getUTCDay(); // 0 Sun … 6 Sat (in ICT-shifted clock)
  const daysSinceMonday = (dow + 6) % 7;
  ict.setUTCDate(ict.getUTCDate() - daysSinceMonday);
  return ict.toISOString().slice(0, 10);
}

/** Add `days` to a `YYYY-MM-DD` date string, returning a new date string. */
export function addDays(dateStr: string, days: number): string {
  return new Date(Date.parse(`${dateStr}T00:00:00Z`) + days * 86_400_000)
    .toISOString()
    .slice(0, 10);
}
