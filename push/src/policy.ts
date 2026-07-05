/**
 * Notification policy (#16): every rule that decides *whether now is the moment* lives
 * here as pure functions, so ticks can rerun any time and the send log stays the only
 * state. Blocked ≠ dropped: a deferred notification goes out on a later tick, dedup'd
 * by the store's (endpoint, kind, ref) key.
 */

/** Max successful pushes per subscriber per UTC day: won/lost + streak + headroom. */
export const DAILY_LIMIT = 3;

/** Streak nudges only fire in the evening run-up to the 00:00 UTC rollover. */
export const NUDGE_START_HOUR_UTC = 18;

/** In-window when the quiet range wraps midnight (start > end) or not (start < end). */
export function inQuietHours(hourUtc: number, quietStart: number, quietEnd: number): boolean {
  if (quietStart === quietEnd) return false; // zero-length window = quiet hours off
  if (quietStart < quietEnd) return hourUtc >= quietStart && hourUtc < quietEnd;
  return hourUtc >= quietStart || hourUtc < quietEnd;
}

/** Streak nudges are useless after rollover and spammy at noon: 18:00-23:59 UTC only. */
export function inNudgeWindow(hourUtc: number): boolean {
  return hourUtc >= NUDGE_START_HOUR_UTC;
}

export interface SendGate {
  hourUtc: number;
  quietStart: number;
  quietEnd: number;
  alreadySent: boolean;
  sentToday: number;
}

export type Verdict = "send" | "already-sent" | "quiet-hours" | "rate-limited";

export function gate(g: SendGate): Verdict {
  if (g.alreadySent) return "already-sent";
  if (inQuietHours(g.hourUtc, g.quietStart, g.quietEnd)) return "quiet-hours";
  if (g.sentToday >= DAILY_LIMIT) return "rate-limited";
  return "send";
}

/** Start of the current UTC day in ms — the window for the daily rate limit. */
export function utcDayStartMs(now: number): number {
  return now - (now % 86_400_000);
}
