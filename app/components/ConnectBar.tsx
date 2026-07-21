"use client";

import { useWallet } from "../hooks/useWallet";
import { useOnline } from "../hooks/useOnline";
import { Wallet, WifiOff } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "./ui/Button";
import { Avatar } from "./ui/Avatar";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Account chip inside MiniPay / injected wallets; guidance everywhere else. */
export function ConnectBar() {
  const { address, miniPay, connecting, noProvider, error, wallets, connect } = useWallet();
  const online = useOnline();

  if (address) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-700 glass-panel px-4 py-2 rounded-full mx-auto w-fit">
          <Avatar address={address} size="sm" />
          <span className="font-medium">{shorten(address)}</span>
          {miniPay && <span className="rounded-md bg-celo-green/20 px-2 py-0.5 text-[10px] font-bold text-celo-green uppercase tracking-wider">MiniPay</span>}
        </div>
        {!online && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-500 uppercase tracking-wide">
            <WifiOff className="h-3 w-3" /> Offline (Cached Data)
          </span>
        )}
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
            <Button
              key={w.info.rdns}
              variant="secondary"
              size="sm"
              onClick={() => void connect(w.info.rdns)}
              isLoading={connecting}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.info.icon} alt="" className="h-5 w-5 rounded-md" />
              {w.info.name}
            </Button>
          ))}
        </div>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <Button
        variant="primary"
        size="sm"
        onClick={() => void connect()}
        isLoading={connecting}
      >
        {!connecting && <Wallet className="h-4 w-4" />}
        {connecting ? "Connecting…" : "Connect wallet"}
      </Button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
