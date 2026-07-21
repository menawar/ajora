"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { motion, type Variants } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { Skeleton } from "../../components/ui/Skeleton";
import { ConnectBar } from "../../components/ConnectBar";
import { publicClient } from "../../lib/clients";
import { contracts } from "../../lib/contracts";
import { useSave } from "../../hooks/usePotVault";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";
import { ErrorAlert } from "../../components/ui/ErrorAlert";
import { useToast } from "../../hooks/useToast";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";
import confetti from "canvas-confetti";
import { Ripple } from "../../components/ui/Ripple";

const PRESETS = ["0.1", "0.5", "1"] as const;
const MIN = parseUnits("0.1", 18);

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SavePage() {
  const { address } = useWallet();
  const { save, status, reset } = useSave();
  const { multiplierX10 } = useStreak();
  const { t } = useTranslation();
  const { toast } = useToast();

  const [amount, setAmount] = useState<string>("0.1");
  const [custom, setCustom] = useState(false);
  const [balance, setBalance] = useState<bigint>();

  useEffect(() => {
    if (status.step === "success") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#35d07f', '#fbcc5c']
      });
      toast(`Saved! +${status.tickets.toString()} tickets. Now pick your lucky number 🎯`, "success");
      trackEvent(AnalyticsEvents.SAVE_COMPLETED, { amount, tickets: status.tickets.toString() });
      // Reset status after a delay so it doesn't stay in success state indefinitely
      setTimeout(() => reset(), 4000);
    }
  }, [status, toast, reset, amount]);

  useEffect(() => {
    if (!address) return;
    void publicClient
      .readContract({ ...contracts.cusd, functionName: "balanceOf", args: [address] })
      .then(setBalance)
      .catch(() => undefined);
  }, [address, status.step]);

  const parsed = useMemo(() => {
    try {
      return parseUnits(amount === "" ? "0" : amount, 18);
    } catch {
      return 0n;
    }
  }, [amount]);

  const tickets = (parsed / MIN) * multiplierX10 / 10n;
  const tooSmall = parsed > 0n && parsed < MIN;
  const insufficient = balance !== undefined && parsed > balance;
  const busy = status.step === "approving" || status.step === "saving";

  return (
    <motion.main 
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">{t("nav.save")}</h1>
        <p className="mt-2 text-sm text-text-secondary">
          {t("save.subtitle")}
        </p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      <motion.section variants={itemVariants} className="flex flex-col gap-5 mt-2">
        <div className="grid grid-cols-4 gap-3" role="group" aria-label="Amount presets">
          {PRESETS.map((p) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={p}
              type="button"
              aria-pressed={!custom && amount === p}
              onClick={() => {
                setCustom(false);
                setAmount(p);
                reset();
              }}
              className={`rounded-2xl py-3.5 font-bold transition-all ${
                !custom && amount === p
                  ? "bg-celo-green text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)]"
                  : "glass-panel text-text-primary hover:bg-bg-secondary"
              }`}
            >
              {p}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            aria-pressed={custom}
            onClick={() => {
              setCustom(true);
              setAmount("");
              reset();
            }}
            className={`rounded-2xl py-3.5 font-bold transition-all ${
              custom
                ? "bg-celo-green text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)]"
                : "glass-panel text-text-primary hover:bg-bg-secondary"
            }`}
            aria-label="Custom amount"
          >
            …
          </motion.button>
        </div>

        {custom && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }}
            className="relative overflow-hidden"
          >
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted h-5 w-5 pointer-events-none" aria-hidden="true" />
            <input
              id="custom-amount-input"
              aria-label="Custom amount in cUSD"
              inputMode="decimal"
              placeholder={t("save.amountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full rounded-2xl bg-bg-secondary border-none pl-12 pr-4 py-4 text-lg font-bold text-text-primary outline-none focus:ring-2 focus:ring-celo-green transition-all placeholder:text-text-muted placeholder:font-normal"
            />
          </motion.div>
        )}

        <div className="glass-panel rounded-2xl p-4 flex justify-between items-center text-sm">
          <span className="text-text-muted font-medium flex items-center gap-2">
            {address && balance === undefined && <Skeleton variant="text" className="w-24 h-4" />}
            {balance !== undefined &&
              t("save.balance", { balance: Number(formatUnits(balance, 18)).toFixed(2) })}
          </span>
          <motion.span 
            key={tickets.toString()}
            initial={{ scale: 1.1, color: "#35d07f" }}
            animate={{ scale: 1, color: "var(--text-primary)" }}
            className="font-bold bg-bg-secondary px-3 py-1 rounded-lg text-text-primary"
          >
            {parsed >= MIN ? t("save.tickets", { tickets: tickets.toString() }) : "0 Tickets"}
          </motion.span>
        </div>

        <Ripple className="w-full rounded-2xl">
          <motion.button
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => {
              trackEvent(AnalyticsEvents.SAVE_INITIATED, { amount });
              reset();
              void save(amount);
            }}
            disabled={busy || !address || parsed < MIN || insufficient}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-celo-green px-4 py-4 text-lg font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73] disabled:opacity-50 disabled:pointer-events-none"
          >
            {busy ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {status.step === "approving" ? t("save.approving") : t("save.saving")}
              </>
            ) : (
              t("save.submit", { amount: amount || "…" })
            )}
          </motion.button>
        </Ripple>

        {tooSmall && <p className="text-center text-sm font-semibold text-amber-600 bg-amber-50 p-2 rounded-lg">{t("save.tooSmall")}</p>}
        {insufficient && (
          <p className="text-center text-sm font-semibold text-amber-600 bg-amber-50 p-2 rounded-lg">{t("save.insufficient")}</p>
        )}
        {status.step === "error" && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <ErrorAlert message={status.message} />
            <button type="button" onClick={() => void save(amount)} className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors py-1 px-3 bg-bg-secondary rounded-lg">
              Retry Transaction
            </button>
          </div>
        )}
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        More saved = more tickets. Streaks multiply your tickets up to 3x.
      </motion.footer>
    </motion.main>
  );
}
