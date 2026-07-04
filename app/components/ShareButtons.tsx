"use client";

import { useState } from "react";
import { renderCard, type CardData } from "../lib/winCard";
import { shareCard, shareToFarcaster } from "../lib/share";

/**
 * Share a rendered card to WhatsApp (primary) or Farcaster. `refCode` lights up
 * once the CrewRegistry UI (#11) knows the user's own code.
 */
export function ShareButtons({
  card,
  text,
  refCode,
}: {
  card: CardData;
  text: string;
  refCode?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onShare = async () => {
    setBusy(true);
    try {
      const blob = await renderCard({ ...card, refCode });
      await shareCard(blob, text, refCode);
    } catch {
      // user dismissed the share sheet — nothing to do
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => void onShare()}
        disabled={busy}
        className="rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Preparing…" : "Share on WhatsApp 💬"}
      </button>
      <button
        type="button"
        onClick={() => shareToFarcaster(text, refCode)}
        className="rounded-xl bg-[#7c65c1] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Cast
      </button>
    </div>
  );
}
