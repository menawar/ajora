/**
 * Canvas-rendered share cards — generated client-side as PNG blobs so they can be
 * shared straight into WhatsApp/Farcaster with no server. Two templates:
 * a draw win and a streak milestone. (AJORA_SPEC.md §11 share card spec.)
 */

const W = 1080;
const H = 1080;

interface WinCardData {
  kind: "win";
  amountCusd: string; // formatted, e.g. "2.40"
  streakDays: number;
  refCode?: string;
}

interface MilestoneCardData {
  kind: "milestone";
  streakDays: number; // 7 / 30 / 90
  multiplier: string; // e.g. "1.5x"
  refCode?: string;
}

export type CardData = WinCardData | MilestoneCardData;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderCard(data: CardData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");

  // Celo gradient backdrop
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#35d07f");
  bg.addColorStop(1, "#fbcc5c");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Card panel
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  roundRect(ctx, 60, 60, W - 120, H - 120, 48);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.fillStyle = "#1a1a2e";

  // Header
  ctx.font = "bold 84px system-ui, sans-serif";
  ctx.fillText("Ajora 🎉", W / 2, 210);
  ctx.font = "42px system-ui, sans-serif";
  ctx.fillStyle = "#555";
  ctx.fillText("Save small, keep every cent, win big.", W / 2, 280);

  if (data.kind === "win") {
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText("I chopped", W / 2, 450);
    ctx.fillStyle = "#0aa860";
    ctx.font = "bold 150px system-ui, sans-serif";
    ctx.fillText(`${data.amountCusd} cUSD`, W / 2, 610);
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 64px system-ui, sans-serif";
    ctx.fillText("in tonight's draw 💸", W / 2, 720);
    if (data.streakDays > 1) {
      ctx.font = "48px system-ui, sans-serif";
      ctx.fillStyle = "#b45309";
      ctx.fillText(`🔥 ${data.streakDays}-day saving streak`, W / 2, 810);
    }
  } else {
    ctx.fillStyle = "#b45309";
    ctx.font = "bold 130px system-ui, sans-serif";
    ctx.fillText(`🔥 ${data.streakDays} days`, W / 2, 520);
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 60px system-ui, sans-serif";
    ctx.fillText("saving streak on Ajora", W / 2, 620);
    ctx.fillStyle = "#0aa860";
    ctx.font = "bold 72px system-ui, sans-serif";
    ctx.fillText(`${data.multiplier} ticket boost earned`, W / 2, 730);
  }

  // Footer: no-loss promise + ref link
  ctx.fillStyle = "#555";
  ctx.font = "40px system-ui, sans-serif";
  ctx.fillText("No-loss: your savings are always yours.", W / 2, 890);
  ctx.fillStyle = "#0aa860";
  ctx.font = "bold 44px system-ui, sans-serif";
  const site = typeof window !== "undefined" ? window.location.host : "ajora.app";
  ctx.fillText(data.refCode ? `${site}/?ref=${data.refCode}` : site, W / 2, 960);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}
