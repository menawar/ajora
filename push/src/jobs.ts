import type { PushStore, SendKind, Subscription } from "./store.ts";
import { gate, inNudgeWindow, utcDayStartMs } from "./policy.ts";

export interface NotificationPayload {
  title: string;
  body: string;
  /** Collapses repeat notifications client-side and routes the tap. */
  tag: string;
  url: string;
}

export interface JobDeps {
  store: PushStore;
  indexerUrl: string;
  /** Delivers one push; resolves true when the push service accepted it. */
  send: (sub: Subscription, payload: NotificationPayload) => Promise<boolean>;
  now?: () => number;
  fetchJson?: (url: string) => Promise<unknown>;
}

export interface JobReport {
  kind: string;
  sent: number;
  failed: number;
  deferred: number; // quiet hours — a later tick retries
  deduped: number;
  rateLimited: number;
  skipped?: string;
}

const defaultFetchJson = async (url: string): Promise<unknown> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

const cusd = (wei: string): string => (Number(BigInt(wei) / 10n ** 14n) / 10_000).toFixed(2);

export const dayOf = (nowMs: number): bigint => BigInt(Math.floor(nowMs / 1000 / 86_400));

/** Post-draw sends (spec §10): winners get the amount, everyone else the winning number. */
export async function runDrawJob(deps: JobDeps, periodId?: bigint): Promise<JobReport> {
  const now = deps.now ?? Date.now;
  const fetchJson = deps.fetchJson ?? defaultFetchJson;
  // Yesterday's period resolves shortly after 00:00 UTC — that's the default target.
  const period = periodId ?? dayOf(now()) - 1n;

  const digest = (await fetchJson(`${deps.indexerUrl}/notify/draw/${period}`)) as {
    resolved: boolean;
    winningNumber?: number;
    winners?: { address: string; share: string }[];
    losers?: string[];
  };
  const report = empty("draw");
  if (!digest.resolved) return { ...report, skipped: "unresolved" };

  for (const w of digest.winners ?? []) {
    await attempt(deps, report, now(), [w.address], "won", String(period), {
      title: "You won the jara! 🎉",
      body: `${cusd(w.share)} cUSD is yours — open Ajora to claim it.`,
      tag: `draw-${period}`,
      url: "/draw",
    });
  }
  if ((digest.losers ?? []).length > 0) {
    await attempt(deps, report, now(), digest.losers ?? [], "lost", String(period), {
      title: `${digest.winningNumber} hit tonight`,
      body: "Not your number this time — your savings are safe. New draw is live now.",
      tag: `draw-${period}`,
      url: "/pick",
    });
  }
  return report;
}

/** Evening streak nudge (spec §10): one timely reminder, never more. */
export async function runStreakJob(deps: JobDeps): Promise<JobReport> {
  const now = deps.now ?? Date.now;
  const fetchJson = deps.fetchJson ?? defaultFetchJson;
  const report = empty("streak");

  const hour = new Date(now()).getUTCHours();
  if (!inNudgeWindow(hour)) return { ...report, skipped: "outside-window" };

  const atRisk = (await fetchJson(`${deps.indexerUrl}/notify/at-risk`)) as {
    day: string;
    rows: { address: string; streak: number }[];
  };

  for (const r of atRisk.rows) {
    await attempt(deps, report, now(), [r.address], "streak", atRisk.day, {
      title: `🔥 ${r.streak}-day streak at risk`,
      body: "Check in before midnight to keep your multiplier growing.",
      tag: `streak-${atRisk.day}`,
      url: "/",
    });
  }
  return report;
}

async function attempt(
  deps: JobDeps,
  report: JobReport,
  nowMs: number,
  addresses: string[],
  kind: SendKind,
  ref: string,
  payload: NotificationPayload,
): Promise<void> {
  for (const sub of deps.store.forAddresses(addresses)) {
    const verdict = gate({
      hourUtc: new Date(nowMs).getUTCHours(),
      quietStart: sub.quietStart,
      quietEnd: sub.quietEnd,
      alreadySent: deps.store.alreadySent(sub.endpoint, kind, ref),
      sentToday: deps.store.sentSince(sub.endpoint, utcDayStartMs(nowMs)),
    });
    if (verdict === "already-sent") report.deduped += 1;
    else if (verdict === "quiet-hours") report.deferred += 1;
    else if (verdict === "rate-limited") report.rateLimited += 1;
    else {
      const ok = await deps.send(sub, payload);
      deps.store.recordSend(sub.endpoint, kind, ref, ok);
      if (ok) report.sent += 1;
      else report.failed += 1;
    }
  }
}

const empty = (kind: string): JobReport => ({
  kind,
  sent: 0,
  failed: 0,
  deferred: 0,
  deduped: 0,
  rateLimited: 0,
});
