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
import { ErrorAlert } from "../../components/ui/ErrorAlert";
import { triggerWinConfetti } from "../../lib/confetti";

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
    <div className="mx-auto h-28 w-28 overflow-hidden rounded-[2rem] bg-bg-secondary shadow-inner border-2 border-gray-100 dark:border-gray-800">
      <div
        className="flex flex-col transition-transform duration-[2500ms] ease-[cubic-bezier(0.15,0.85,0.2,1)]"
        style={{ transform: settled ? `translateY(${targetY}px)` : "translateY(0)" }}
      >
        {digits.map((d, i) => (
          <div
            key={i}
            className={`flex h-28 w-28 shrink-0 items-center justify-center text-6xl font-black text-text-primary transition-all duration-500 ${
              settled && i === digits.length - 1 ? "bg-celo-green text-white shadow-[inset_0_0_20px_rgba(0,0,0,0.1)]" : ""
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

  useEffect(() => {
    if (last?.won) {
      const timer = setTimeout(() => {
        triggerWinConfetti();
      }, 2500); // Trigger after the RevealNumber animation finishes
      return () => clearTimeout(timer);
    }
  }, [last?.won]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary">
      <header className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">The Draw</h1>
        <p className="mt-2 text-sm text-text-secondary">Every night after midnight UTC.</p>
      </header>

      <ConnectBar />

      {/* ---- last night ---- */}
      <section className="glass-panel rounded-3xl p-6 text-center">
        <div className="mb-6 text-sm font-bold uppercase tracking-widest text-text-muted">Last night&apos;s number</div>

        {loading && <Skeleton variant="rectangular" className="mx-auto h-28 w-28 rounded-[2rem]" />}

        {!loading && last && !last.resolved && (
          <>
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-[2rem] bg-bg-secondary text-5xl shadow-inner border-2 border-gray-100 dark:border-gray-800 animate-pulse">
              🎲
            </div>
            <p className="mt-6 text-sm font-medium text-text-secondary">
              Drawing… the keeper is revealing the seed. Check back in a few minutes.
            </p>
          </>
        )}

        {!loading && last && last.resolved && (
          <>
            <RevealNumber value={last.winningNumber} />

            {last.totalWinningWeight === 0n ? (
              <p className="mt-6 text-sm font-medium text-text-secondary">
                Nobody hit {last.winningNumber} — the whole pot rolled into today&apos;s draw 🔄
              </p>
            ) : (
              <div className="mt-6 flex flex-col gap-4">
                {last.winners.length > 0 && (
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-bg-secondary p-4 text-left shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                      Winning wallet{last.winners.length > 1 ? "s" : ""}
                    </p>
                    <p className="font-mono text-sm font-medium text-text-primary bg-white dark:bg-gray-800 px-3 py-2 rounded-xl inline-block shadow-sm">
                      {last.winners.length === 1
                        ? `${last.winners[0].address.slice(0, 10)}…${last.winners[0].address.slice(-8)}`
                        : `${last.winners.length} winners`}
                    </p>
                    {last.winners.length === 1 && (
                      <div className="mt-3 flex items-center justify-between text-xs font-medium">
                        <span className="text-text-secondary">Share: <strong className="text-text-primary">{cusd(last.winners[0].share)} cUSD</strong></span>
                        <span className={`px-2 py-1 rounded-md ${last.winners[0].claimed ? "bg-celo-green/10 text-celo-green" : "bg-amber-100 text-amber-700"}`}>
                          {last.winners[0].claimed ? "Claimed" : "Unclaimed"}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {last.won ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 2.5 }}
                    className="flex flex-col gap-4 bg-celo-green/5 p-4 rounded-2xl border border-celo-green/20"
                  >
                    <p className="font-black text-celo-green text-xl text-center tracking-tight">
                      You won{last.claimed ? "!" : ` ${cusd(last.prize)} cUSD!`} 🎉
                    </p>
                    {!last.claimed ? (
                      <>
                        {error && (
                          <div className="flex flex-col items-center gap-2">
                            <ErrorAlert message={error} />
                            <button
                              type="button"
                              onClick={() => void claimPrize()}
                              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors py-1 px-3 bg-white rounded-lg shadow-sm"
                            >
                              Retry Transaction
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => void claimPrize()}
                          disabled={claiming}
                          className="rounded-2xl bg-celo-green px-4 py-4 font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {claiming ? "Claiming…" : `Claim ${cusd(last.prize)} cUSD`}
                        </button>
                      </>
                    ) : (
                      <p className="text-sm font-medium text-text-secondary text-center bg-white p-3 rounded-xl shadow-sm">
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
                    className="text-sm font-medium text-text-secondary text-center mt-2 bg-bg-secondary p-3 rounded-xl"
                  >
                    {address ? "Not your night — your savings are safe. Tomorrow! 💪" : ""}
                  </motion.p>
                )}

                {last.canRecycle && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left shadow-sm">
                    <p className="text-sm font-bold text-amber-900 mb-1">Missed claim window</p>
                    <p className="text-sm text-amber-800 leading-relaxed mb-4">
                      Roll the leftover pot into the current draw now.
                    </p>
                    <button
                      type="button"
                      onClick={() => void recycleUnclaimed()}
                      disabled={recycling || !address}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 px-4 py-3.5 font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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
      <section className="rounded-3xl bg-gradient-to-br from-celo-green via-[#2ebf73] to-celo-gold p-6 text-center text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="text-sm font-bold uppercase tracking-widest opacity-90 mb-2 relative z-10">Tonight&apos;s pot so far</div>
        <div className="text-4xl font-black tracking-tight drop-shadow-md mb-3 relative z-10">
          {pot.loading ? <Skeleton variant="text" className="h-10 w-32 mx-auto bg-white/20" /> : `${cusd(pot.jaraPot)} `}
          {!pot.loading && <span className="text-xl font-bold opacity-80 uppercase tracking-wide">cUSD</span>}
        </div>
        <div className="text-sm font-medium bg-white/20 p-3 rounded-xl backdrop-blur-md border border-white/20 relative z-10">
          {myPick.number !== 0
            ? <span className="flex items-center justify-center gap-2">You're in with <strong className="bg-white text-celo-green px-2 py-0.5 rounded-md">{myPick.weight.toString()}</strong> tickets on <strong className="bg-white text-celo-green px-2 py-0.5 rounded-md text-lg">{myPick.number}</strong></span>
            : "Save + pick to enter"}
        </div>
      </section>

      {/* ---- sponsor the pot ---- */}
      <section className="glass-panel rounded-3xl p-6">
        <div className="text-sm font-bold text-text-primary mb-1">Sponsor tonight&apos;s pot</div>
        <p className="text-xs text-text-secondary leading-relaxed">
          Anyone can add jara — every cent goes to tonight&apos;s winners.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            inputMode="decimal"
            placeholder="Amount in cUSD"
            value={sponsorAmount}
            onChange={(e) => {
              setSponsorAmount(e.target.value.replace(/[^0-9.]/g, ""));
              resetSponsor();
            }}
            className="min-w-0 flex-1 rounded-2xl bg-bg-secondary border-none px-4 py-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-celo-green transition-all placeholder:font-normal placeholder:text-text-muted"
          />
          <button
            type="button"
            onClick={() => void sponsor(sponsorAmount)}
            disabled={sponsoring || !address || sponsorParsed === 0n}
            className="rounded-2xl bg-text-primary px-5 py-3.5 font-bold text-bg-primary shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none hover:opacity-90"
          >
            {sponsorStatus.step === "approving"
              ? "Approving…"
              : sponsorStatus.step === "funding"
                ? "Adding…"
                : "Add"}
          </button>
        </div>
        {sponsorStatus.step === "success" && (
          <p className="mt-3 text-sm font-bold text-celo-green bg-celo-green/10 p-3 rounded-xl text-center">
            Jara added — tonight&apos;s winners chop your love 🎉
          </p>
        )}
        {sponsorStatus.step === "error" && (
          <p className="mt-3 text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl text-center">{sponsorStatus.message}</p>
        )}
      </section>

      {operatorConnected && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <div className="text-sm font-bold text-amber-900 mb-1">Missed draw recovery</div>
          <p className="text-xs text-amber-800 leading-relaxed mb-4">
            Keeper/admin only. Use this when a period missed resolution and needs a recommit,
            then a later reveal.
          </p>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
              Period ID
              <input
                inputMode="numeric"
                value={recoveryPeriod}
                onChange={(e) => setRecoveryPeriod(e.target.value.replace(/[^0-9]/g, ""))}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono transition-all text-sm"
                placeholder="e.g. 1234"
              />
            </label>

            <label className="grid gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider">
              Keeper secret
              <input
                value={recoverySecret}
                onChange={(e) => setRecoverySecret(e.target.value.trim())}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className="rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
                placeholder="0x..."
              />
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                if (!recoveryPeriodId) return;
                void recommitMissedDraw(recoveryPeriodId, recoverySecret);
              }}
              disabled={!recoveryPeriodId || !recoverySecret || recovering !== "idle"}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-3.5 font-bold text-white shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
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
              className="rounded-xl border-2 border-amber-300 bg-white hover:bg-amber-50 px-4 py-3.5 font-bold text-amber-900 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {recovering === "revealing" ? "Revealing…" : "Reveal and resolve"}
            </button>
          </div>

          <div className="mt-4 p-3 bg-amber-100/50 rounded-xl border border-amber-200/50">
            <p className="text-xs text-amber-800 leading-relaxed">
              <code className="bg-amber-200/50 px-1 rounded font-semibold">recommit</code> derives the commitment locally from the keeper secret.{" "}
              <code className="bg-amber-200/50 px-1 rounded font-semibold">reveal</code> uses the same secret after the anchor block is ready.
            </p>
            {(keeper || admin) && (
              <p className="mt-2 text-[11px] font-medium text-amber-700/80 uppercase tracking-widest border-t border-amber-200/50 pt-2">
                keeper <span className="font-mono lowercase bg-amber-200/30 px-1 rounded">{keeper ? `${keeper.slice(0, 6)}…${keeper.slice(-4)}` : "unset"}</span> · admin{" "}
                <span className="font-mono lowercase bg-amber-200/30 px-1 rounded">{admin ? `${admin.slice(0, 6)}…${admin.slice(-4)}` : "unset"}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {error && <p className="text-center text-sm font-semibold text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>}

      <footer className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        Draws are commit-reveal + blockhash — verifiably fair, see RANDOMNESS.md in the repo.
      </footer>
    </main>
  );
}
