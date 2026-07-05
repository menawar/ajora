import { test } from "node:test";
import assert from "node:assert/strict";
import { PushStore, type Subscription } from "../src/store.ts";
import { runClaimJob, type JobDeps } from "../src/jobs.ts";

const NOON = Date.UTC(2026, 6, 5, 12, 0, 0);

function sub(endpoint: string, address: string): Subscription {
  return { endpoint, address, p256dh: "k", auth: "a", quietStart: 21, quietEnd: 5 };
}

function deps(rows: unknown[]): JobDeps & { delivered: string[] } {
  const store = new PushStore(":memory:");
  const delivered: string[] = [];
  return {
    store,
    delivered,
    indexerUrl: "http://indexer.test",
    now: () => NOON,
    fetchJson: async () => ({ rows }),
    send: async (s, p) => {
      delivered.push(`${s.endpoint}:${p.title}`);
      return true;
    },
  };
}

const row = (daysLeft: number) => ({
  address: "0xaa",
  periodId: "20630",
  amount: "2500000000000000000",
  daysLeft,
});

test("no reminder while more than 4 days remain", async () => {
  const d = deps([row(6)]);
  d.store.upsert(sub("e-aa", "0xaa"));
  const r = await runClaimJob(d);
  assert.equal(r.sent, 0);
});

test("early slot fires at ≤4 days, once", async () => {
  const d = deps([row(4)]);
  d.store.upsert(sub("e-aa", "0xaa"));
  const r1 = await runClaimJob(d);
  const r2 = await runClaimJob(d);
  assert.equal(r1.sent, 1);
  assert.equal(r2.deduped, 1);
  assert.match(d.delivered[0]!, /Your jara is waiting/);
});

test("final slot is a separate at-most-once reminder", async () => {
  const d = deps([row(4)]);
  d.store.upsert(sub("e-aa", "0xaa"));
  await runClaimJob(d); // early sent

  d.fetchJson = async () => ({ rows: [row(1)] });
  const rFinal = await runClaimJob(d);
  assert.equal(rFinal.sent, 1, "final slot sends even though early already did");
  assert.match(d.delivered[1]!, /Last day to claim/);

  const again = await runClaimJob(d);
  assert.equal(again.deduped, 1);
});

test("skipping straight to final only sends final", async () => {
  const d = deps([row(1)]);
  d.store.upsert(sub("e-aa", "0xaa"));
  const r = await runClaimJob(d);
  assert.equal(r.sent, 1);
  assert.equal(d.delivered.length, 1);
  assert.match(d.delivered[0]!, /Last day/);
});

test("non-subscribers stay silent", async () => {
  const d = deps([row(2)]);
  const r = await runClaimJob(d);
  assert.equal(r.sent + r.failed + r.deduped, 0);
});
