import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DAILY_LIMIT,
  gate,
  inNudgeWindow,
  inQuietHours,
  utcDayStartMs,
} from "../src/policy.ts";

test("quiet hours wrap midnight (21 -> 5)", () => {
  assert.equal(inQuietHours(21, 21, 5), true);
  assert.equal(inQuietHours(23, 21, 5), true);
  assert.equal(inQuietHours(0, 21, 5), true);
  assert.equal(inQuietHours(4, 21, 5), true);
  assert.equal(inQuietHours(5, 21, 5), false);
  assert.equal(inQuietHours(12, 21, 5), false);
  assert.equal(inQuietHours(20, 21, 5), false);
});

test("quiet hours in a same-day range (13 -> 15)", () => {
  assert.equal(inQuietHours(12, 13, 15), false);
  assert.equal(inQuietHours(13, 13, 15), true);
  assert.equal(inQuietHours(14, 13, 15), true);
  assert.equal(inQuietHours(15, 13, 15), false);
});

test("equal start/end disables quiet hours", () => {
  for (let h = 0; h < 24; h++) assert.equal(inQuietHours(h, 9, 9), false);
});

test("nudge window is the evening run-up to rollover", () => {
  assert.equal(inNudgeWindow(17), false);
  assert.equal(inNudgeWindow(18), true);
  assert.equal(inNudgeWindow(23), true);
  assert.equal(inNudgeWindow(0), false);
});

test("gate ordering: dedupe beats quiet hours beats rate limit", () => {
  const base = { hourUtc: 12, quietStart: 21, quietEnd: 5, alreadySent: false, sentToday: 0 };
  assert.equal(gate(base), "send");
  assert.equal(gate({ ...base, alreadySent: true }), "already-sent");
  assert.equal(gate({ ...base, hourUtc: 22 }), "quiet-hours");
  assert.equal(gate({ ...base, sentToday: DAILY_LIMIT }), "rate-limited");
  // already-sent wins even inside quiet hours: reruns stay silent, not deferred
  assert.equal(gate({ ...base, alreadySent: true, hourUtc: 22 }), "already-sent");
});

test("utcDayStartMs floors to midnight UTC", () => {
  const noon = Date.UTC(2026, 6, 5, 12, 34, 56);
  assert.equal(utcDayStartMs(noon), Date.UTC(2026, 6, 5));
  assert.equal(utcDayStartMs(Date.UTC(2026, 6, 5)), Date.UTC(2026, 6, 5));
});
