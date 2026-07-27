import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { readCache, writeCache } from "../offline";

describe("offline.ts", () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const k in mockStorage) delete mockStorage[k];
    (global as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, val: string) => {
          mockStorage[key] = val;
        },
      },
    };
  });

  it("should return null for missing cache keys", () => {
    assert.strictEqual(readCache("non_existent"), null);
  });

  it("should write and read simple primitive values", () => {
    writeCache("user_streak", 5);
    const cached = readCache<number>("user_streak");
    assert.notStrictEqual(cached, null);
    assert.strictEqual(cached?.value, 5);
  });

  it("should serialize and revive BigInt values correctly", () => {
    const amount = 1000000000000000000n;
    writeCache("balance", { amount });
    const cached = readCache<{ amount: bigint }>("balance");
    assert.notStrictEqual(cached, null);
    assert.strictEqual(cached?.value.amount, amount);
  });
});
