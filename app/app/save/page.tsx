"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { motion, type Variants } from "framer-motion";
import { Coins, Loader2 } from "lucide-react";
import { useTranslation } from "../../lib/i18n";
import { ConnectBar } from "../../components/ConnectBar";
import { publicClient } from "../../lib/clients";
import { contracts } from "../../lib/contracts";
import { useSave } from "../../hooks/usePotVault";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";
import { ErrorAlert } from "../../components/ui/ErrorAlert";

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

  const [amount, setAmount] = useState<string>("0.1");
  const [custom, setCustom] = useState(false);
  const [balance, setBalance] = useState<bigint>();

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
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center">
        <h1 className="text-2xl font-bold">{t("nav.save")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t("save.subtitle")}
        </p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      <motion.section variants={itemVariants} className="flex flex-col gap-4">
        <div className="grid grid-cols-4 gap-2" role="group" aria-label="Amount presets">
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
              className={`rounded-xl py-3 font-semibold transition-all shadow-sm ${
                !custom && amount === p
                  ? "bg-celo-green text-white shadow-celo-green/30"
                  : "glass-panel text-gray-700 hover:bg-white/80 border border-gray-200/50"
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
            className={`rounded-xl py-3 font-semibold transition-all shadow-sm ${
              custom
                ? "bg-celo-green text-white shadow-celo-green/30"
                : "glass-panel text-gray-700 hover:bg-white/80 border border-gray-200/50"
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
            <Coins className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" aria-hidden="true" />
            <input
              id="custom-amount-input"
              aria-label="Custom amount in cUSD"
              inputMode="decimal"
              placeholder={t("save.amountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              className="w-full rounded-xl border border-gray-200 glass-panel pl-12 pr-4 py-3 text-lg outline-celo-green transition-all focus:shadow-[0_0_12px_rgba(53,208,127,0.3)]"
            />
          </motion.div>
        )}

        <div className="flex justify-between text-sm text-gray-500 px-1">
          <span>
            {balance !== undefined &&
              t("save.balance", { balance: Number(formatUnits(balance, 18)).toFixed(2) })}
          </span>
          <motion.span 
            key={tickets.toString()}
            initial={{ scale: 1.1, color: "#35d07f" }}
            animate={{ scale: 1, color: "#6b7280" }}
          >
            {parsed >= MIN && t("save.tickets", { tickets: tickets.toString() })}
          </motion.span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => {
            reset();
            void save(amount);
          }}
          disabled={busy || !address || parsed < MIN || insufficient}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-celo-green to-[#2ebf73] px-4 py-4 text-lg font-bold text-white shadow-md shadow-celo-green/20 transition-all hover:shadow-lg hover:shadow-celo-green/30 disabled:opacity-50"
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

        {tooSmall && <p className="text-center text-sm text-amber-600">{t("save.tooSmall")}</p>}
        {insufficient && (
          <p className="text-center text-sm text-amber-600">{t("save.insufficient")}</p>
        )}
        {status.step === "success" && (
          <p className="text-center text-sm text-celo-green">
            Saved! +{status.tickets.toString()} tickets. Now pick your lucky number 🎯
          </p>
        )}
        {status.step === "error" && (
          <div className="flex flex-col items-center gap-2">
            <ErrorAlert message={status.message} />
            <button type="button" onClick={() => void save(amount)} className="text-sm underline text-gray-500 hover:text-gray-700">
              Retry
            </button>
          </div>
        )}
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto text-center text-xs text-gray-400">
        More saved = more tickets. Streaks multiply your tickets up to 3x.
      </motion.footer>
    </motion.main>
  );
}
