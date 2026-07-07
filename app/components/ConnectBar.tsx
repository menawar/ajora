"use client";

import { useWallet } from "../hooks/useWallet";

function shorten(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

/** Account chip inside MiniPay / injected wallets; guidance everywhere else. */
export function ConnectBar() {
  const { address, miniPay, connecting, noProvider, error, wallets, connect } = useWallet();

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

  // Several extensions announced themselves (EIP-6963): let the user pick the
  // exact wallet instead of trusting whichever proxy hijacked window.ethereum.
  if (wallets.length > 1) {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex flex-wrap justify-center gap-2">
          {wallets.map((w) => (
            <button
              key={w.info.rdns}
              type="button"
              onClick={() => void connect(w.info.rdns)}
              disabled={connecting}
              className="flex items-center gap-1.5 rounded-lg border border-celo-green px-3 py-2 text-sm font-medium text-celo-green disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.info.icon} alt="" className="h-4 w-4" />
              {w.info.name}
            </button>
          ))}
        </div>
        {error && <p className="text-center text-xs text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={() => void connect()}
        disabled={connecting}
        className="mx-auto rounded-lg border border-celo-green px-4 py-2 text-sm font-medium text-celo-green disabled:opacity-50"
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </button>
      {error && <p className="text-center text-xs text-red-500">{error}</p>}
    </div>
  );
}
