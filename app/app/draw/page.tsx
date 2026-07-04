"use client";

import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { ConnectBar } from "../../components/ConnectBar";
import { ShareButtons } from "../../components/ShareButtons";
import { useCrew } from "../../hooks/useCrew";
import { useDraw } from "../../hooks/useDraw";
import { usePotToday } from "../../hooks/usePotVault";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

/** Cycles 1-9 for a beat, then settles on the real number. */
function RevealNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(1);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    let ticks = 0;
    const spin = setInterval(() => {
      ticks += 1;
      setShown((s) => (s % 9) + 1);
      if (ticks > 14) {
        clearInterval(spin);
        setShown(value);
        setSettled(true);
      }
    }, 90);
    return () => clearInterval(spin);
  }, [value]);

  return (
    <div
      className={`mx-auto flex h-28 w-28 items-center justify-center rounded-3xl text-6xl font-black text-white transition-transform ${
        settled ? "scale-110 bg-celo-green" : "bg-celo-dark"
      }`}
    >
      {shown}
    </div>
  );
}

export default function DrawPage() {
  const { address } = useWallet();
  const pot = usePotToday();
  const { last, myPick, loading, claimPrize, claiming, error } = useDraw();
  const { streakDays } = useStreak();
  const { myCode } = useCrew();

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">The Draw</h1>
        <p className="mt-1 text-sm text-gray-500">Every night after midnight UTC.</p>
      </header>

      <ConnectBar />

      {/* ---- last night ---- */}
      <section className="rounded-2xl border border-gray-100 p-6 text-center">
        <div className="mb-4 text-sm font-medium text-gray-500">Last night&apos;s number</div>

        {loading && <div className="mx-auto h-28 w-28 animate-pulse rounded-3xl bg-gray-100" />}

        {!loading && last && !last.resolved && (
          <>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-gray-100 text-5xl">
              🎲
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Drawing… the keeper is revealing the seed. Check back in a few minutes.
            </p>
          </>
        )}

        {!loading && last && last.resolved && (
          <>
            <RevealNumber value={last.winningNumber} />

            {last.totalWinningWeight === 0n ? (
              <p className="mt-4 text-sm text-gray-500">
                Nobody hit {last.winningNumber} — the whole pot rolled into today&apos;s draw 🔄
              </p>
            ) : last.won ? (
              <div className="mt-4 flex flex-col gap-3">
                <p className="font-semibold text-celo-green">
                  You won{last.claimed ? "!" : ` ${cusd(last.prize)} cUSD!`} 🎉
                </p>
                {!last.claimed ? (
                  <button
                    type="button"
                    onClick={() => void claimPrize()}
                    disabled={claiming}
                    className="rounded-xl bg-celo-green px-4 py-3 font-semibold text-white disabled:opacity-50"
                  >
                    {claiming ? "Claiming…" : `Claim ${cusd(last.prize)} cUSD`}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">Prize claimed — it&apos;s in your wallet.</p>
                )}
                <ShareButtons
                  card={{
                    kind: "win",
                    amountCusd: cusd(last.prize),
                    streakDays: Number(streakDays),
                  }}
                  text={`I just chopped ${cusd(last.prize)} cUSD in Ajora's daily draw — no-loss savings, real winnings 💸`}
                  refCode={myCode || undefined}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">
                {address ? "Not your night — your savings are safe. Tomorrow! 💪" : ""}
              </p>
            )}
          </>
        )}
      </section>

      {/* ---- tonight ---- */}
      <section className="rounded-2xl bg-gradient-to-br from-celo-green to-celo-gold p-5 text-center text-white">
        <div className="text-sm opacity-90">Tonight&apos;s pot so far</div>
        <div className="text-2xl font-bold">{cusd(pot.jaraPot)} cUSD</div>
        <div className="mt-1 text-sm opacity-90">
          {myPick.number !== 0
            ? `You're in with ${myPick.weight.toString()} tickets on ${myPick.number}`
            : "Save + pick to enter"}
        </div>
      </section>

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <footer className="mt-auto text-center text-xs text-gray-400">
        Draws are commit-reveal + blockhash — verifiably fair, see RANDOMNESS.md in the repo.
      </footer>
    </main>
  );
}
