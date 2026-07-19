"use client";

import { usePush } from "../hooks/usePush";
import { Button } from "./ui/Button";

const hourLabel = (h: number) =>
  new Date(2026, 0, 1, h).toLocaleTimeString([], { hour: "numeric" });

/**
 * Opt-in bell for draw results + streak reminders (#16), with the quiet-hours
 * picker (#61) once enabled. Renders nothing when the environment can't do Web
 * Push (no NEXT_PUBLIC_PUSH_URL, unsupported browser).
 */
export function PushToggle() {
  const { supported, enabled, busy, error, enable, disable, quiet, setQuietHours } = usePush();
  if (!supported) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant={enabled ? "outline" : "secondary"}
          size="sm"
          disabled={busy}
          onClick={() => void (enabled ? disable() : enable())}
          className={`rounded-full ${enabled ? "border-transparent bg-celo-green/10" : ""}`}
          aria-pressed={enabled}
        >
          {enabled ? "🔔 Draw alerts on" : "🔕 Get draw alerts"}
        </Button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>

      {enabled && (
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          Quiet hours
          <select
            value={quiet.start}
            disabled={busy}
            onChange={(e) => void setQuietHours(Number(e.target.value), quiet.end)}
            className="rounded border border-gray-200 bg-white px-1 py-0.5"
            aria-label="Quiet hours start"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
          –
          <select
            value={quiet.end}
            disabled={busy}
            onChange={(e) => void setQuietHours(quiet.start, Number(e.target.value))}
            className="rounded border border-gray-200 bg-white px-1 py-0.5"
            aria-label="Quiet hours end"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {hourLabel(h)}
              </option>
            ))}
          </select>
          <span className="text-gray-400">your time</span>
        </label>
      )}
    </div>
  );
}
