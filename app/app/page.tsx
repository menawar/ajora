"use client";

import { useState } from "react";

/**
 * Ajora Mini App — Week-1 UI scaffold (Next.js App Router + Tailwind).
 *
 * The real flow (Save → Pick → Spray → Draw → Claim) wires up to the PotVault /
 * DrawManager contracts via viem + the MiniPay injected provider.
 * See AJORA_SPEC.md §11 for the full screen spec.
 */
export default function Home() {
  const [tickets, setTickets] = useState(0);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">Ajora 🎉</h1>
        <p className="mt-1 text-gray-500">Save small, keep every cent, chop jara.</p>
      </header>

      <section className="rounded-2xl bg-gradient-to-br from-celo-green to-celo-gold p-5 text-white shadow-sm">
        <div className="text-sm opacity-90">Today&apos;s jara pot</div>
        <div className="text-3xl font-bold">—.— cUSD</div>
        <div className="text-sm opacity-90">Draw at 8:00 PM</div>
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setTickets((t) => t + 10)}
          className="rounded-xl bg-celo-green px-4 py-4 text-lg font-semibold text-white transition active:scale-[0.99]"
        >
          Save 0.10 cUSD → +10 tickets
        </button>
        <p className="text-center text-gray-500">
          You have <strong>{tickets}</strong> tickets for tonight&apos;s draw
        </p>
      </section>

      <footer className="mt-auto text-center text-xs text-gray-400">
        Wallet + contract wiring is stubbed — see AJORA_SPEC.md
      </footer>
    </main>
  );
}
