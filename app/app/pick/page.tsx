"use client";

import Link from "next/link";
import { useState } from "react";
import { ConnectBar } from "../../components/ConnectBar";
import { useDraw } from "../../hooks/useDraw";
import { usePotToday } from "../../hooks/usePotVault";
import { useWallet } from "../../hooks/useWallet";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export default function PickPage() {
  const { address } = useWallet();
  const pot = usePotToday();
  const { myPick, pick, picking, error } = useDraw();
  const [selected, setSelected] = useState<number>();

  const hasTickets = pot.myTickets > 0n;
  const active = selected ?? myPick.number;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Pick your number</h1>
        <p className="mt-1 text-sm text-gray-500">
          {hasTickets ? (
            <>
              Your <strong>{pot.myTickets.toString()}</strong> tickets ride on one number.
            </>
          ) : (
            "Save first to earn tickets for tonight's draw."
          )}
        </p>
      </header>

      <ConnectBar />

      <section className="grid grid-cols-3 gap-3">
        {NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={!hasTickets || picking}
            onClick={() => setSelected(n)}
            className={`aspect-square rounded-2xl border text-3xl font-bold transition active:scale-95 ${
              active === n
                ? "border-celo-green bg-celo-green text-white"
                : "border-gray-200 text-gray-700 disabled:opacity-40"
            }`}
          >
            {n}
          </button>
        ))}
      </section>

      {myPick.number !== 0 && (
        <p className="text-center text-sm text-gray-500">
          Current pick: <strong>{myPick.number}</strong> with{" "}
          <strong>{myPick.weight.toString()}</strong> tickets
          {selected && selected !== myPick.number && " — picking again replaces it"}
        </p>
      )}

      {hasTickets ? (
        <button
          type="button"
          disabled={!selected || picking || selected === myPick.number}
          onClick={() => selected && void pick(selected)}
          className="rounded-xl bg-celo-green px-4 py-4 text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {picking
            ? "Locking in…"
            : myPick.number !== 0
              ? "Update pick"
              : "Lock it in 🎯"}
        </button>
      ) : (
        <Link
          href="/save"
          className="rounded-xl bg-celo-green px-4 py-4 text-center text-lg font-semibold text-white"
        >
          Save to get tickets
        </Link>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}
      {!error && myPick.number !== 0 && !selected && (
        <p className="text-center text-sm text-celo-green">
          You&apos;re in tonight&apos;s draw. Come back after midnight UTC 🌙
        </p>
      )}

      <footer className="mt-auto text-center text-xs text-gray-400">
        Re-picking before the day closes moves all your tickets to the new number.
      </footer>
    </main>
  );
}
