import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { trackEvent, AnalyticsEvents } from "../analytics";

describe("analytics.ts", () => {
  beforeEach(() => {
    (global as unknown as { window: unknown }).window = { dataLayer: [] };
  });

  it("should push events to window.dataLayer", () => {
    trackEvent(AnalyticsEvents.WALLET_CONNECTED, { address: "0x123" });
    const dataLayer = (global.window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer;
    assert.strictEqual(dataLayer.length, 1);
    assert.deepStrictEqual(dataLayer[0], {
      event: "Wallet Connected",
      address: "0x123",
    });
  });

  it("should handle trackEvent without optional properties", () => {
    trackEvent(AnalyticsEvents.SAVE_COMPLETED);
    const dataLayer = (global.window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer;
    assert.strictEqual(dataLayer.length, 1);
    assert.strictEqual(dataLayer[0].event, "Save Completed");
  });
});
