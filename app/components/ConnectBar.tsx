"use client";

import { useWallet } from "../hooks/useWallet";
import { Wallet } from "lucide-react";
import { motion } from "framer-motion";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Account chip inside MiniPay / injected wallets; guidance everywhere else. */
export function ConnectBar() {
  const { address, miniPay, connecting, noProvider, error, wallets, connect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-700 glass-panel px-4 py-2 rounded-full mx-auto w-fit">
        <span className="h-2 w-2 rounded-full bg-celo-green shadow-[0_0_8px_rgba(53,208,127,0.8)] animate-pulse" />
        <span className="font-medium">{shorten(address)}</span>
        {miniPay && <span className="rounded-md bg-celo-green/20 px-2 py-0.5 text-[10px] font-bold text-celo-green uppercase tracking-wider">MiniPay</span>}
      </div>
    );
  }

  if (noProvider) {
    return (
      <p className="text-center text-sm text-gray-500">
        Open Ajora inside <strong>MiniPay</strong> to play — Opera Mini &gt; MiniPay &gt; Discover.
      </p>
    );
  }

  // Several extensions announced themselves (EIP-6963): let the user pick the
  // exact wallet instead of trusting whichever proxy hijacked window.ethereum.
  if (wallets.length > 1) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-wrap justify-center gap-2">
          {wallets.map((w) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={w.info.rdns}
              type="button"
              onClick={() => void connect(w.info.rdns)}
              disabled={connecting}
              className="flex items-center gap-2 rounded-xl glass-panel px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-white/80 disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.info.icon} alt="" className="h-5 w-5 rounded-md" />
              {w.info.name}
            </motion.button>
          ))}
        </div>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button
        whileTap={{ scale: 0.95 }}
        type="button"
        onClick={() => void connect()}
        disabled={connecting}
        className="mx-auto flex items-center gap-2 rounded-xl bg-gradient-to-r from-celo-green to-[#2ebf73] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-celo-green/20 transition-all hover:shadow-lg hover:shadow-celo-green/30 disabled:opacity-50"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? "Connecting…" : "Connect wallet"}
      </motion.button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
