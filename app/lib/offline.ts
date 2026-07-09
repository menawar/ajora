// Offline tolerance (#91). A tiny localStorage cache so read screens can show the
// last-known state when the network drops — a real case on the spotty mobile
// connections in the MiniPay market. Cached values routinely contain `bigint`
// (wei amounts), which JSON can't represent, so bigints are tagged on write and
// revived on read.

const PREFIX = "ajora.cache.";

interface Envelope<T> {
  v: T;
  at: number; // epoch ms of the last successful write
}

export interface Cached<T> {
  value: T;
  at: number;
}

function replacer(_key: string, value: unknown) {
  return typeof value === "bigint" ? { $bigint: value.toString() } : value;
}

function reviver(_key: string, value: unknown) {
  if (
    value !== null &&
    typeof value === "object" &&
    "$bigint" in value &&
    typeof (value as Record<string, unknown>).$bigint === "string"
  ) {
    return BigInt((value as { $bigint: string }).$bigint);
  }
  return value;
}

/** Last successfully-cached value for `key`, or null if absent/unreadable. */
export function readCache<T>(key: string): Cached<T> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const env = JSON.parse(raw, reviver) as Envelope<T>;
    return { value: env.v, at: env.at };
  } catch {
    return null;
  }
}

/** Best-effort persist — silently no-ops on quota/private-mode failures. */
export function writeCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    const env: Envelope<T> = { v: value, at: Date.now() };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(env, replacer));
  } catch {
    /* storage unavailable — cache is optional */
  }
}
