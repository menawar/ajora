import { test } from "node:test";
import assert from "node:assert/strict";
import { PushStore, type Subscription } from "../src/store.ts";
import { runDrawJob, runStreakJob, dayOf, type JobDeps } from "../src/jobs.ts";

const NOON = Date.UTC(2026, 6, 5, 12, 0, 0); // outside quiet hours + nudge window
const EVENING = Date.UTC(2026, 6, 5, 19, 0, 0); // in nudge window, before quiet
const NIGHT = Date.UTC(2026, 6, 5, 22, 0, 0); // inside default quiet hours

const PERIOD = dayOf(NOON) - 1n;

function sub(endpoint: string, address: string): Subscription {
  return { endpoint, address, p256dh: "k", auth: "a", quietStart: 21, quietEnd: 5 };
}

function deps(nowMs: number, digest: unknown): JobDeps & { delivered: string[] } {
  const store = new PushStore(":memory:");
  const delivered: string[] = [];
  return {
    store,
    delivered,
    indexerUrl: "http://indexer.test",
    now: () => nowMs,
    fetchJson: async () => digest,
    send: async (s, p) => {
      delivered.push(`${s.endpoint}:${p.tag}:${p.title}`);
      return true;
    },
  };
}

const drawDigest = {
  resolved: true,
  winningNumber: 7,
  winners: [{ address: "0xaa", share: "2500000000000000000" }], // 2.50 cUSD
  losers: ["0xbb", "0xcc"],
};

test("draw job: winners get the amount, losers the number; only subscribers hear", async () => {
  const d = deps(NOON, drawDigest);
  d.store.upsert(sub("e-aa", "0xAA"));
  d.store.upsert(sub("e-bb", "0xBB"));
  // 0xcc never subscribed

  const report = await runDrawJob(d);
  assert.equal(report.sent, 2);
  assert.equal(d.delivered.length, 2);
  assert.match(d.delivered[0]!, /e-aa:draw-20638:You won the jara! 🎉/);
  assert.match(d.delivered[1]!, /e-bb:draw-20638:7 hit tonight/);
});

test("draw job: rerunning the tick sends nothing twice", async () => {
  const d = deps(NOON, drawDigest);
  d.store.upsert(sub("e-aa", "0xaa"));

  await runDrawJob(d);
  const second = await runDrawJob(d);
  assert.equal(second.sent, 0);
  assert.equal(second.deduped, 1);
  assert.equal(d.delivered.length, 1);
});

test("draw job: unresolved period skips cleanly", async () => {
  const d = deps(NOON, { resolved: false });
  const report = await runDrawJob(d);
  assert.equal(report.skipped, "unresolved");
});

test("quiet hours defer, a later tick delivers exactly once", async () => {
  const night = deps(NIGHT, drawDigest);
  night.store.upsert(sub("e-aa", "0xaa"));
  const r1 = await runDrawJob(night, PERIOD);
  assert.equal(r1.deferred, 1);
  assert.equal(night.delivered.length, 0);

  // Same store, next morning's tick.
  const morning: JobDeps = {
    ...night,
    now: () => Date.UTC(2026, 6, 6, 6, 0, 0),
  };
  const r2 = await runDrawJob(morning, PERIOD);
  assert.equal(r2.sent, 1);
});

test("streak job: outside the evening window it does nothing", async () => {
  const d = deps(NOON, { day: "20639", rows: [{ address: "0xaa", streak: 4 }] });
  d.store.upsert(sub("e-aa", "0xaa"));
  const report = await runStreakJob(d);
  assert.equal(report.skipped, "outside-window");
  assert.equal(d.delivered.length, 0);
});

test("streak job: one nudge per day, with the streak length in the title", async () => {
  const d = deps(EVENING, { day: "20639", rows: [{ address: "0xaa", streak: 4 }] });
  d.store.upsert(sub("e-aa", "0xaa"));

  const r1 = await runStreakJob(d);
  const r2 = await runStreakJob(d);
  assert.equal(r1.sent, 1);
  assert.equal(r2.deduped, 1);
  assert.match(d.delivered[0]!, /🔥 4-day streak at risk/);
});

test("daily rate limit caps a subscriber's pushes", async () => {
  const d = deps(EVENING, { day: "20639", rows: [{ address: "0xaa", streak: 2 }] });
  d.store.upsert(sub("e-aa", "0xaa"));
  // Simulate 3 successful sends already today.
  d.store.recordSend("e-aa", "won", "a", true);
  d.store.recordSend("e-aa", "lost", "b", true);
  d.store.recordSend("e-aa", "won", "c", true);

  const report = await runStreakJob(d);
  assert.equal(report.rateLimited, 1);
  assert.equal(d.delivered.length, 0);
});

test("failed delivery is recorded and not retried for the same event", async () => {
  const d = deps(NOON, drawDigest);
  d.store.upsert(sub("e-aa", "0xaa"));
  d.send = async () => false;

  const r1 = await runDrawJob(d);
  assert.equal(r1.failed, 1);
  const r2 = await runDrawJob(d);
  assert.equal(r2.deduped, 1);
});
