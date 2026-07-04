"use client";

import { formatUnits } from "viem";
import { ConnectBar } from "../components/ConnectBar";
import { usePotToday, useSave } from "../hooks/usePotVault";
import { useWallet } from "../hooks/useWallet";

function countdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

function cusd(value: bigint): string {
  const n = Number(formatUnits(value, 18));
  return n.toLocaleString("en", { maximumFractionDigits: 2 });
}

/**
 * Home: live view of today's pot straight from Celo mainnet, plus the
 * one-tap save. Full Save/Pick/Crew screens land with #9/#10/#11.
 */
export default function Home() {
  const { address } = useWallet();
  const pot = usePotToday();
  const { save, status, reset } = useSave();

  const busy = status.step === "approving" || status.step === "saving";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">Ajora 🎉</h1>
        <p className="mt-1 text-gray-500">Save small, keep every cent, chop jara.</p>
      </header>

      <ConnectBar />

      <section className="rounded-2xl bg-gradient-to-br from-celo-green to-celo-gold p-5 text-white shadow-sm">
        <div className="text-sm opacity-90">Today&apos;s jara pot</div>
        <div className="text-3xl font-bold">
          {pot.loading ? "…" : `${cusd(pot.jaraPot)} cUSD`}
        </div>
        <div className="mt-1 flex justify-between text-sm opacity-90">
          <span>Draw closes in {countdown(pot.secondsToClose)}</span>
          <span>{pot.totalTickets.toString()} tickets in</span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => {
            reset();
            void save("0.1");
          }}
          disabled={busy || !address}
          className="rounded-xl bg-celo-green px-4 py-4 text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {status.step === "approving"
            ? "Approving cUSD…"
            : status.step === "saving"
              ? "Saving…"
              : "Save 0.10 cUSD"}
        </button>

        {status.step === "success" && (
          <p className="text-center text-sm text-celo-green">
            Saved! +{status.tickets.toString()} tickets for tonight&apos;s draw 🎉
          </p>
        )}
        {status.step === "error" && (
          <p className="text-center text-sm text-red-500">{status.message}</p>
        )}

        {address && !pot.loading && (
          <p className="text-center text-sm text-gray-500">
            You have <strong>{pot.myTickets.toString()}</strong> tickets ·{" "}
            <strong>{cusd(pot.myPrincipal)} cUSD</strong> saved today (always withdrawable)
          </p>
        )}
      </section>

      <footer className="mt-auto text-center text-xs text-gray-400">
        No-loss: your savings are always yours. Only the bonus is at stake.
      </footer>
    </main>
  );
}
