"use client";

import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { Copy, CheckCircle2, Share } from "lucide-react";
import { useState } from "react";
import { triggerSmallConfetti } from "../lib/confetti";

interface ReferralCardProps {
  code: string;
  memberCount: number;
}

export function ReferralCard({ code, memberCount }: ReferralCardProps) {
  const [copied, setCopied] = useState(false);
  
  // Format the link for Ajora
  // If hosted on vercel, we'd use window.location.origin, but since this might be SSR/MiniPay
  // we default to the production URL.
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://ajora.app";
  const referralLink = `${baseUrl}?ref=${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    triggerSmallConfetti();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join my Ajora Crew",
        text: "Save without risk and win daily prizes with me on Ajora!",
        url: referralLink,
      }).catch(console.error);
    } else {
      handleCopy();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="glass-panel rounded-[2rem] overflow-hidden flex flex-col border border-celo-green/20"
    >
      <div className="bg-gradient-to-br from-bg-secondary to-bg-primary p-6 flex flex-col items-center">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4">
          Your Referral Code
        </h3>
        
        <div className="bg-white p-3 rounded-2xl shadow-sm mb-4 ring-4 ring-celo-green/10">
          <QRCode
            value={referralLink}
            size={160}
            bgColor="#ffffff"
            fgColor="#1a1a1a"
            level="L"
          />
        </div>
        
        <div className="flex flex-col items-center gap-1 w-full max-w-[240px]">
          <div className="text-xs font-semibold text-text-muted mb-1">Crew Link</div>
          
          <button
            onClick={handleCopy}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all active:scale-95 ${
              copied 
                ? "border-celo-green bg-celo-green/10 text-celo-green" 
                : "border-gray-200 dark:border-gray-800 bg-bg-primary text-text-primary hover:border-celo-green/50"
            }`}
          >
            <span className="font-mono font-bold truncate max-w-[150px]">{referralLink}</span>
            {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-4 h-4 text-text-muted" />}
          </button>
        </div>
      </div>
      
      <div className="bg-bg-primary border-t border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
            Crew Members
          </span>
          <span className="text-lg font-black text-celo-green">
            {memberCount}
          </span>
        </div>
        
        <button
          onClick={handleShare}
          className="flex items-center gap-2 bg-text-primary text-bg-primary px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <Share className="w-4 h-4" /> Share
        </button>
      </div>
    </motion.div>
  );
}
