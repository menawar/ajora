"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { ConnectBar } from "../../components/ConnectBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { useCrew } from "../../hooks/useCrew";

const ShareButtons = dynamic(() => import("../../components/ShareButtons").then((mod) => mod.ShareButtons));
import { useDraw } from "../../hooks/useDraw";
import { usePotToday, useSponsor } from "../../hooks/usePotVault";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";

function cusd(value: bigint): string {
  return Number(formatUnits(value, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

/** Hardware-accelerated slot-machine number roll */
function RevealNumber({ value }: { value: number }) {
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    // Slight delay to ensure the DOM has rendered at translateY(0) before transitioning
    const t = setTimeout(() => setSettled(true), 50);
    return () => clearTimeout(t);
  }, []);

  const digits = useMemo(() => {
    const seq = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    // Repeat sequence a few times for a long spin, ending with the target value
    return [...seq, ...seq, ...seq, value];
  }, [value]);

  // Each digit is 112px tall (h-28 = 7rem = 112px)
  const stripHeight = digits.length * 112;
  const targetY = -(stripHeight - 112); // scroll so the last element is visible

  return (
    <div className="mx-auto h-28 w-28 overflow-hidden rounded-3xl bg-celo-dark">
      <div
        className="flex flex-col transition-transform duration-[2500ms] ease-[cubic-bezier(0.15,0.85,0.2,1)]"
        style={{ transform: settled ? `translateY(${targetY}px)` : "translateY(0)" }}
      >
        {digits.map((d, i) => (
          <div
            key={i}
            className={`flex h-28 w-28 shrink-0 items-center justify-center text-6xl font-black text-white transition-colors duration-500 ${
              settled && i === digits.length - 1 ? "bg-celo-green" : ""
            }`}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DrawPage() {
  const { address } = useWallet();
  const pot = usePotToday();
  const {
    last,
    myPick,
    loading,
    claimPrize,
    claiming,
    recycleUnclaimed,
    recycling,
    recommitMissedDraw,
    revealMissedDraw,
    recovering,
    keeper,
    admin,
    error,
  } = useDraw();
  const { streakDays } = useStreak();
  const { myCode } = useCrew();
  const { sponsor, status: sponsorStatus, reset: resetSponsor } = useSponsor();

  const [sponsorAmount, setSponsorAmount] = useState("");
  const [recoveryPeriod, setRecoveryPeriod] = useState("");
  const [recoverySecret, setRecoverySecret] = useState("");
  const sponsorParsed = useMemo(() => {
    try {
      return parseUnits(sponsorAmount === "" ? "0" : sponsorAmount, 18);
    } catch {
      return 0n;
    }
  }, [sponsorAmount]);
  const recoveryPeriodId = useMemo(() => {
    const value = recoveryPeriod.trim();
    if (value === "") return null;
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }, [recoveryPeriod]);
  const sponsoring = sponsorStatus.step === "approving" || sponsorStatus.step === "funding";
  const operatorConnected =
    Boolean(address) &&
    Boolean(keeper || admin) &&
    (address?.toLowerCase() === keeper?.toLowerCase() || address?.toLowerCase() === admin?.toLowerCase());

  const { refetch } = pot;
  useEffect(() => {
    if (sponsorStatus.step === "success") refetch();
  }, [sponsorStatus.step, refetch]);
  useEffect(() => {
    if (last && recoveryPeriod.trim() === "") {
      setRecoveryPeriod(last.periodId.toString());
    }
  }, [last?.periodId]);

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

        {loading && <Skeleton variant="rectangular" className="mx-auto h-28 w-28 rounded-3xl" />}

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
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {last.winners.length > 0 && (
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-left">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Winning wallet
                    </p>
                    <p className="mt-1 font-mono text-sm text-gray-900">
                      {last.winners.length === 1
                        ? last.winners[0].address
                        : `${last.winners.length} winners`}
                    </p>
                    {last.winners.length === 1 && (
                      <p className="mt-1 text-xs text-gray-500">
                        Share: {cusd(last.winners[0].share)} cUSD
                        {last.winners[0].claimed ? " · claimed" : " · unclaimed"}
                      </p>
                    )}
                  </div>
                )}
                {last.won ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 2.5 }}
                    className="flex flex-col gap-3"
                  >
                    <p className="font-semibold text-celo-green text-lg text-center">
                      You won{last.claimed ? "!" : ` ${cusd(last.prize)} cUSD!`} 🎉
                    </p>
                    {!last.claimed ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => void claimPrize()}
                        disabled={claiming}
                        className="rounded-xl bg-celo-green px-4 py-3 font-semibold text-white shadow-md shadow-celo-green/20 transition-all hover:shadow-lg hover:shadow-celo-green/30 disabled:opacity-50"
                      >
                        {claiming ? "Claiming…" : `Claim ${cusd(last.prize)} cUSD`}
                      </motion.button>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">
                        Prize claimed — it&apos;s in your wallet.
                      </p>
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
                  </motion.div>
                ) : (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 2.5 }}
                    className="text-sm text-gray-500 text-center mt-2"
                  >
                    {address ? "Not your night — your savings are safe. Tomorrow! 💪" : ""}
                  </motion.p>
                )}

                {last.canRecycle && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                    <p className="text-sm font-medium text-amber-900">Missed claim window</p>
                    <p className="mt-1 text-sm text-amber-800">
                      Roll the leftover pot into the current draw now.
                    </p>
                    <button
                      type="button"
                      onClick={() => void recycleUnclaimed()}
                      disabled={recycling || !address}
                      className="mt-3 rounded-xl bg-amber-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
                    >
                      {recycling ? "Rolling over…" : "Roll over unclaimed pot"}
                    </button>
                  </div>
                )}
              </div>
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

      {/* ---- sponsor the pot ---- */}
      <section className="rounded-2xl border border-gray-100 p-5">
        <div className="text-sm font-medium text-gray-500">Sponsor tonight&apos;s pot</div>
        <p className="mt-1 text-xs text-gray-400">
          Anyone can add jara — every cent goes to tonight&apos;s winners.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            inputMode="decimal"
            placeholder="cUSD"
            value={sponsorAmount}
            onChange={(e) => {
              setSponsorAmount(e.target.value.replace(/[^0-9.]/g, ""));
              resetSponsor();
            }}
            className="min-w-0 flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-celo-green"
          />
          <button
            type="button"
            onClick={() => void sponsor(sponsorAmount)}
            disabled={sponsoring || !address || sponsorParsed === 0n}
            className="rounded-xl bg-celo-green px-5 py-3 font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
          >
            {sponsorStatus.step === "approving"
              ? "Approving…"
              : sponsorStatus.step === "funding"
                ? "Adding…"
                : "Add"}
          </button>
        </div>
        {sponsorStatus.step === "success" && (
          <p className="mt-2 text-sm text-celo-green">
            Jara added — tonight&apos;s winners chop your love 🎉
          </p>
        )}
        {sponsorStatus.step === "error" && (
          <p className="mt-2 text-sm text-red-500">{sponsorStatus.message}</p>
        )}
      </section>

      {operatorConnected && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="text-sm font-medium text-amber-900">Missed draw recovery</div>
          <p className="mt-1 text-xs text-amber-800">
            Keeper/admin only. Use this when a period missed resolution and needs a recommit,
            then a later reveal.
          </p>

          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-xs font-medium text-amber-900">
              Period ID
              <input
                inputMode="numeric"
                value={recoveryPeriod}
                onChange={(e) => setRecoveryPeriod(e.target.value.replace(/[^0-9]/g, ""))}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 outline-amber-500"
                placeholder="e.g. 1234"
              />
            </label>

            <label className="grid gap-1 text-xs font-medium text-amber-900">
              Keeper secret
              <input
                value={recoverySecret}
                onChange={(e) => setRecoverySecret(e.target.value.trim())}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm outline-amber-500"
                placeholder="0x..."
              />
            </label>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                if (!recoveryPeriodId) return;
                void recommitMissedDraw(recoveryPeriodId, recoverySecret);
              }}
              disabled={!recoveryPeriodId || !recoverySecret || recovering !== "idle"}
              className="rounded-xl bg-amber-600 px-4 py-3 font-semibold text-white disabled:opacity-50"
            >
              {recovering === "recommitting" ? "Recommitting…" : "Recommit missed draw"}
            </button>
            <button
              type="button"
              onClick={() => {
                if (!recoveryPeriodId) return;
                void revealMissedDraw(recoveryPeriodId, recoverySecret);
              }}
              disabled={!recoveryPeriodId || !recoverySecret || recovering !== "idle"}
              className="rounded-xl border border-amber-300 bg-white px-4 py-3 font-semibold text-amber-900 disabled:opacity-50"
            >
              {recovering === "revealing" ? "Revealing…" : "Reveal and resolve"}
            </button>
          </div>

          <p className="mt-3 text-xs text-amber-800">
            <code>recommit</code> derives the commitment locally from the keeper secret.{" "}
            <code>reveal</code> uses the same secret after the anchor block is ready.
          </p>
          {(keeper || admin) && (
            <p className="mt-2 text-[11px] text-amber-700">
              keeper {keeper ? `${keeper.slice(0, 6)}…${keeper.slice(-4)}` : "unset"} · admin{" "}
              {admin ? `${admin.slice(0, 6)}…${admin.slice(-4)}` : "unset"}
            </p>
          )}
        </section>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <footer className="mt-auto text-center text-xs text-gray-400">
        Draws are commit-reveal + blockhash — verifiably fair, see RANDOMNESS.md in the repo.
      </footer>
    </main>
  );
}
