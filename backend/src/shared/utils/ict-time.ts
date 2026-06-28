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
