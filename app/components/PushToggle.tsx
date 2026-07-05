"use client";

import { usePush } from "../hooks/usePush";

/**
 * Opt-in bell for draw results + streak reminders (#16). Renders nothing when the
 * environment can't do Web Push (no NEXT_PUBLIC_PUSH_URL, unsupported browser).
 */
export function PushToggle() {
  const { supported, enabled, busy, error, enable, disable } = usePush();
  if (!supported) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void (enabled ? disable() : enable())}
        className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
          enabled ? "bg-celo-green/10 text-celo-green" : "bg-gray-100 text-gray-600"
        } ${busy ? "opacity-50" : ""}`}
        aria-pressed={enabled}
      >
        {enabled ? "🔔 Draw alerts on" : "🔕 Get draw alerts"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
