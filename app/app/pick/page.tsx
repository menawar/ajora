"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { ConnectBar } from "../../components/ConnectBar";
import { Skeleton } from "../../components/ui/Skeleton";
import { useTranslation } from "../../lib/i18n";
import { useDraw } from "../../hooks/useDraw";
import { usePotToday } from "../../hooks/usePotVault";
import { useWallet } from "../../hooks/useWallet";
import { useToast } from "../../hooks/useToast";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";
import confetti from "canvas-confetti";
import { ErrorAlert } from "../../components/ui/ErrorAlert";
import { PulseRing } from "../../components/ui/PulseRing";
import { Ripple } from "../../components/ui/Ripple";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

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

export default function PickPage() {
  const { address } = useWallet();
  const pot = usePotToday();
  const { myPick, pick, picking, error } = useDraw();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [selected, setSelected] = useState<number>();

  // Show a toast when the user successfully picks a number
  useEffect(() => {
    if (myPick.number !== 0 && selected) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#35d07f', '#fbcc5c', '#ffffff']
      });
      toast(t("pick.success"), "success");
      trackEvent(AnalyticsEvents.NUMBER_PICKED, { number: myPick.number });
      setSelected(undefined); // Clear selection after successful pick
    }
  }, [myPick.number, selected, t, toast]);

  const hasTickets = pot.myTickets > 0n;
  const active = selected ?? myPick.number;

  return (
    <motion.main 
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">{t("pick.title")}</h1>
        <p className="mt-2 text-sm text-text-secondary flex justify-center items-center min-h-[20px]">
          {pot.loading ? (
            <Skeleton variant="text" className="w-48 h-4" />
          ) : hasTickets ? (
            <span dangerouslySetInnerHTML={{ __html: t("pick.subtitle.tickets", { tickets: `<strong class="text-text-primary">${pot.myTickets.toString()}</strong>` }) }} />
          ) : (
            t("pick.subtitle.empty")
          )}
        </p>
      </motion.header>

      <motion.div variants={itemVariants}>
        <ConnectBar />
      </motion.div>

      <motion.section
        variants={itemVariants}
        className="grid grid-cols-3 gap-3 p-4 glass-panel rounded-3xl"
        role="group"
        aria-label={t("pick.number_pad", { defaultValue: "Number pad" })}
      >
        {NUMBERS.map((n) => (
          <motion.button
            whileTap={{ scale: 0.9 }}
            key={n}
            type="button"
            disabled={!hasTickets || picking}
            onClick={() => setSelected(n)}
            aria-label={`Pick number ${n}`}
            aria-pressed={active === n}
            className={`relative aspect-square rounded-[1.25rem] text-4xl font-black transition-all focus:outline-none focus:ring-4 focus:ring-celo-green/50 flex items-center justify-center ${
              active === n
                ? "border-none bg-celo-green text-white shadow-[0_8px_24px_rgba(53,208,127,0.4)] shadow-[inset_0_-4px_rgba(0,0,0,0.1)] scale-105 z-10"
                : "bg-bg-secondary text-text-primary hover:bg-white dark:hover:bg-gray-800 shadow-sm border border-transparent hover:border-gray-200 dark:hover:border-gray-700 disabled:opacity-40 disabled:hover:bg-bg-secondary disabled:hover:scale-100 disabled:cursor-not-allowed"
            }`}
          >
            {active === n && <PulseRing color="rgba(255,255,255,0.3)" size="lg" className="absolute inset-0 m-auto pointer-events-none" />}
            <span className="relative z-10">{n}</span>
          </motion.button>
        ))}
      </motion.section>

      {myPick.number !== 0 && (
        <motion.p variants={itemVariants} className="text-center text-sm font-medium text-text-secondary bg-bg-secondary p-3 rounded-xl mx-4">
          <span dangerouslySetInnerHTML={{ __html: t("pick.current", { number: `<strong class="text-celo-green text-lg">${myPick.number.toString()}</strong>`, weight: `<strong class="text-text-primary">${myPick.weight.toString()}</strong>` }) }} />
          {selected && selected !== myPick.number && <span className="block mt-1 text-xs text-text-muted">{t("pick.current.replaces")}</span>}
        </motion.p>
      )}

      <motion.div variants={itemVariants}>
        {hasTickets ? (
          <Ripple className="w-full rounded-2xl">
            <button
              type="button"
              disabled={!selected || picking || selected === myPick.number}
              onClick={() => selected && void pick(selected)}
              className="w-full rounded-2xl bg-celo-green px-4 py-4 text-lg font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] transition-all hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73] disabled:opacity-50 disabled:pointer-events-none"
            >
              {picking
                ? t("pick.locking")
                : myPick.number !== 0
                  ? t("pick.update")
                  : t("pick.submit")}
            </button>
          </Ripple>
        ) : (
          <Link
            href="/save"
            className="block w-full rounded-2xl bg-celo-gold px-4 py-4 text-center text-lg font-bold text-white shadow-[0_4px_14px_0_rgba(251,204,92,0.39)] transition-all hover:bg-[#eab308] hover:shadow-[0_6px_20px_rgba(251,204,92,0.23)] active:scale-95"
          >
            {t("pick.cta.save")}
          </Link>
        )}
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="mt-2">
          <ErrorAlert message={error} />
        </motion.div>
      )}

      <motion.footer variants={itemVariants} className="mt-auto pt-6 text-center text-xs font-medium text-text-muted pb-safe">
        {t("pick.footer")}
      </motion.footer>
    </motion.main>
  );
}
