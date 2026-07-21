"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, CheckCircle2, Share2, MessageCircle } from "lucide-react";
import { renderCard, type CardData } from "../lib/winCard";
import { shareCard, shareToFarcaster, shareUrl } from "../lib/share";

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
  const [copied, setCopied] = useState(false);

  const link = refCode ? shareUrl(refCode) : typeof window !== "undefined" ? window.location.origin : "https://ajora.app";

  const onShare = async () => {
    setBusy(true);
    try {
      const blob = await renderCard({ ...card, refCode });
      await shareCard(blob, text, refCode);
    } catch {
      // user dismissed the share sheet
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${text}\n\n${link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="grid grid-cols-2 gap-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => void onShare()}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#20b858] transition-colors disabled:opacity-50"
        >
          {busy ? "Preparing…" : <><MessageCircle className="w-4 h-4" /> WhatsApp</>}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => shareToFarcaster(text, refCode)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#7c65c1] px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-[#6c55b1] transition-colors"
        >
          <Share2 className="w-4 h-4" /> Farcaster
        </motion.button>
      </div>
      
      <button
        onClick={handleCopy}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-bg-primary px-4 py-3 text-sm font-bold text-text-primary hover:border-celo-green hover:text-celo-green transition-colors active:scale-95"
      >
        {copied ? (
          <><CheckCircle2 className="w-4 h-4 text-celo-green" /> Copied</>
        ) : (
          <><Copy className="w-4 h-4" /> Copy Link</>
        )}
      </button>
    </div>
  );
}
