import { test } from "node:test";
import assert from "node:assert/strict";
import { PushStore, type Subscription } from "../src/store.ts";

const sub = (endpoint: string, address = "0xAbC"): Subscription => ({
  endpoint,
  address,
  p256dh: "k",
  auth: "a",
  quietStart: 21,
  quietEnd: 5,
});

test("upsert stores lowercase address and updates in place", () => {
  const s = new PushStore(":memory:");
  s.upsert(sub("e1", "0xABCD"));
  s.upsert({ ...sub("e1", "0xABCD"), quietStart: 20 });

  const got = s.forAddresses(["0xabcd"]);
  assert.equal(got.length, 1);
  assert.equal(got[0]?.address, "0xabcd");
  assert.equal(got[0]?.quietStart, 20);
});

test("forAddresses matches case-insensitively and skips strangers", () => {
  const s = new PushStore(":memory:");
  s.upsert(sub("e1", "0xAA"));
  s.upsert(sub("e2", "0xBB"));
  assert.equal(s.forAddresses(["0xAA"]).length, 1);
  assert.equal(s.forAddresses(["0xcc"]).length, 0);
  assert.equal(s.forAddresses([]).length, 0);
});

test("remove drops the subscription", () => {
  const s = new PushStore(":memory:");
  s.upsert(sub("e1"));
  s.remove("e1");
  assert.equal(s.forAddresses(["0xabc"]).length, 0);
});

test("send log is at-most-once per (endpoint, kind, ref)", () => {
  const s = new PushStore(":memory:");
  assert.equal(s.alreadySent("e1", "won", "20639"), false);
  s.recordSend("e1", "won", "20639", true);
  s.recordSend("e1", "won", "20639", true); // rerun tick: no-op
  assert.equal(s.alreadySent("e1", "won", "20639"), true);
  assert.equal(s.sentSince("e1", 0), 1);
});

test("sentSince counts only successful sends in the window", () => {
  const s = new PushStore(":memory:");
  s.recordSend("e1", "won", "1", true);
  s.recordSend("e1", "lost", "2", false); // failure doesn't count toward rate limit
  s.recordSend("e1", "streak", "3", true);
  assert.equal(s.sentSince("e1", 0), 2);
  assert.equal(s.sentSince("e1", Date.now() + 1000), 0);
});

test("metrics aggregates by kind and outcome", () => {
  const s = new PushStore(":memory:");
  s.upsert(sub("e1", "0xAA"));
  s.upsert(sub("e2", "0xBB"));
  s.recordSend("e1", "won", "1", true);
  s.recordSend("e2", "won", "1", false);
  s.recordSend("e1", "streak", "d1", true);

  const m = s.metrics();
  assert.equal(m.subscribers, 2);
  assert.deepEqual(m.sends, [
    { kind: "streak", ok: 1, failed: 0 },
    { kind: "won", ok: 1, failed: 1 },
  ]);
});
