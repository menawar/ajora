/**
 * Share + referral plumbing. WhatsApp is the primary rail (status/groups drive
 * organic growth in our market); Farcaster/Warpcast is secondary. The ?ref=CODE
 * search param is captured on first load and replayed at crew-join time so
 * on-chain attribution completes even days later.
 */

const REF_KEY = "ajora.ref";

/** Capture ?ref=CODE from the URL into localStorage (first writer wins). */
export function captureRef(): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (ref && !localStorage.getItem(REF_KEY)) {
    localStorage.setItem(REF_KEY, ref);
  }
}

/** The referral code this install arrived through, if any. */
export function storedRef(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem(REF_KEY) ?? undefined;
}

export function shareUrl(refCode?: string): string {
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return refCode ? `${base}/?ref=${encodeURIComponent(refCode)}` : base;
}

/**
 * Share a rendered card. Prefers the Web Share API with the image attached
 * (native sheet → WhatsApp on Android/MiniPay); falls back to wa.me text.
 */
export async function shareCard(blob: Blob, text: string, refCode?: string): Promise<void> {
  const url = shareUrl(refCode);
  const file = new File([blob], "ajora-win.png", { type: "image/png" });

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], text: `${text} ${url}` });
    return;
  }
  // Fallback: WhatsApp text share (no image attach possible from the web).
  window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
}

/** Compose on Warpcast with the app link embedded. */
export function shareToFarcaster(text: string, refCode?: string): void {
  const url = shareUrl(refCode);
  window.open(
    `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`,
    "_blank",
  );
}
