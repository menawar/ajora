"use client";

import { useWallet } from "../hooks/useWallet";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Account chip inside MiniPay / injected wallets; guidance everywhere else. */
export function ConnectBar() {
  const { address, miniPay, connecting, noProvider, connect } = useWallet();

  if (address) {
    return (
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <span className="h-2 w-2 rounded-full bg-celo-green" />
        {shorten(address)}
        {miniPay && <span className="rounded bg-celo-green/10 px-1.5 py-0.5 text-xs">MiniPay</span>}
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

  return (
    <button
      type="button"
      onClick={() => void connect()}
      disabled={connecting}
      className="mx-auto rounded-lg border border-celo-green px-4 py-2 text-sm font-medium text-celo-green disabled:opacity-50"
    >
      {connecting ? "Connecting…" : "Connect wallet"}
    </button>
  );
}
