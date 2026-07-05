import { DatabaseSync } from "node:sqlite";

export interface Subscription {
  endpoint: string;
  address: string;
  p256dh: string;
  auth: string;
  /** UTC hours [0-23]; the window wraps midnight when start > end. */
  quietStart: number;
  quietEnd: number;
}

export type SendKind = "won" | "lost" | "streak";

/**
 * SQLite-backed store (node:sqlite, zero native deps). The UNIQUE(endpoint, kind, ref)
 * key on the send log is what makes every notification at-most-once per subscriber per
 * event — ticks can rerun forever without double-sending.
 */
export class PushStore {
  readonly db: DatabaseSync;

  constructor(path: string) {
    this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        endpoint    TEXT PRIMARY KEY,
        address     TEXT NOT NULL,
        p256dh      TEXT NOT NULL,
        auth        TEXT NOT NULL,
        quiet_start INTEGER NOT NULL DEFAULT 21,
        quiet_end   INTEGER NOT NULL DEFAULT 5,
        created_at  INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_subs_address ON subscriptions(address);
      CREATE TABLE IF NOT EXISTS sends (
        endpoint TEXT NOT NULL,
        kind     TEXT NOT NULL,
        ref      TEXT NOT NULL,
        ok       INTEGER NOT NULL,
        sent_at  INTEGER NOT NULL,
        UNIQUE(endpoint, kind, ref)
      );
    `);
  }

  upsert(sub: Subscription): void {
    this.db
      .prepare(
        `INSERT INTO subscriptions (endpoint, address, p256dh, auth, quiet_start, quiet_end, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(endpoint) DO UPDATE SET
           address = excluded.address, p256dh = excluded.p256dh, auth = excluded.auth,
           quiet_start = excluded.quiet_start, quiet_end = excluded.quiet_end`,
      )
      .run(
        sub.endpoint,
        sub.address.toLowerCase(),
        sub.p256dh,
        sub.auth,
        sub.quietStart,
        sub.quietEnd,
        Date.now(),
      );
  }

  remove(endpoint: string): void {
    this.db.prepare("DELETE FROM subscriptions WHERE endpoint = ?").run(endpoint);
  }

  forAddresses(addresses: string[]): Subscription[] {
    if (addresses.length === 0) return [];
    const marks = addresses.map(() => "?").join(",");
    const rows = this.db
      .prepare(
        `SELECT endpoint, address, p256dh, auth, quiet_start, quiet_end
         FROM subscriptions WHERE address IN (${marks})`,
      )
      .all(...addresses.map((a) => a.toLowerCase()));
    return rows.map(rowToSub);
  }

  /** True once a (subscriber, kind, event) send has been recorded — sent or hard-failed. */
  alreadySent(endpoint: string, kind: SendKind, ref: string): boolean {
    return (
      this.db
        .prepare("SELECT 1 FROM sends WHERE endpoint = ? AND kind = ? AND ref = ?")
        .get(endpoint, kind, ref) !== undefined
    );
  }

  recordSend(endpoint: string, kind: SendKind, ref: string, ok: boolean): void {
    this.db
      .prepare(
        `INSERT INTO sends (endpoint, kind, ref, ok, sent_at) VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(endpoint, kind, ref) DO NOTHING`,
      )
      .run(endpoint, kind, ref, ok ? 1 : 0, Date.now());
  }

  /** Successful sends to one subscriber since a timestamp (the daily rate limit input). */
  sentSince(endpoint: string, sinceMs: number): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS n FROM sends WHERE endpoint = ? AND ok = 1 AND sent_at >= ?")
      .get(endpoint, sinceMs) as { n: number };
    return row.n;
  }

  /** Delivery metrics: totals by kind and outcome, plus the live subscriber count. */
  metrics(): { subscribers: number; sends: { kind: string; ok: number; failed: number }[] } {
    const subs = this.db.prepare("SELECT COUNT(*) AS n FROM subscriptions").get() as {
      n: number;
    };
    const rows = this.db
      .prepare(
        `SELECT kind, SUM(ok) AS ok, SUM(1 - ok) AS failed FROM sends GROUP BY kind ORDER BY kind`,
      )
      .all() as { kind: string; ok: number; failed: number }[];
    // node:sqlite rows are null-prototype objects; return plain ones.
    return {
      subscribers: subs.n,
      sends: rows.map((r) => ({ kind: r.kind, ok: Number(r.ok), failed: Number(r.failed) })),
    };
  }
}

function rowToSub(row: unknown): Subscription {
  const r = row as Record<string, string | number>;
  return {
    endpoint: r.endpoint as string,
    address: r.address as string,
    p256dh: r.p256dh as string,
    auth: r.auth as string,
    quietStart: r.quiet_start as number,
    quietEnd: r.quiet_end as number,
  };
}
