"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatUnits } from "viem";
import { motion, type Variants } from "framer-motion";
import { useTranslation } from "../lib/i18n";
import { ConnectBar } from "../components/ConnectBar";
import { Onboarding } from "../components/Onboarding";
import { StreakChip } from "../components/StreakChip";
import { PushToggle } from "../components/PushToggle";
import { Countdown, localCloseTime } from "../components/Countdown";
import { useDraw } from "../hooks/useDraw";
import { usePotToday, useSave } from "../hooks/usePotVault";
import { useWallet } from "../hooks/useWallet";

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
  const { myPick } = useDraw();
  const { t } = useTranslation();

  // If already picked, reuse the same number; otherwise pick a random number 1-9.
  const comboNumber = useMemo(() => myPick.number !== 0 ? myPick.number : Math.floor(Math.random() * 9) + 1, [myPick.number]);

  return (
    <motion.main 
      className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.header variants={itemVariants} className="text-center">
        <h1 className="text-4xl font-bold">Ajora 🎉</h1>
        <p className="mt-1 text-gray-500">
          {t("home.tagline")}{" "}
          <Link href="/faq" className="underline">
            {t("home.faqLink")}
          </Link>
        </p>
      </motion.header>

      <motion.div variants={itemVariants}><Onboarding /></motion.div>
      <motion.div variants={itemVariants}><ConnectBar /></motion.div>
      <motion.div variants={itemVariants}><StreakChip /></motion.div>
      <motion.div variants={itemVariants}><PushToggle /></motion.div>

      <motion.section variants={itemVariants} className="rounded-2xl bg-gradient-to-br from-celo-green to-celo-gold p-5 text-white shadow-sm">
        <div className="text-sm opacity-90">Today&apos;s jara pot</div>
        <div className="text-3xl font-bold">
          {pot.loading ? "…" : `${cusd(pot.jaraPot)} cUSD`}
        </div>
        <div className="mt-1 flex justify-between text-sm opacity-90">
          <span>
            Draw closes in <Countdown closeAt={pot.closeAt} onExpire={pot.refetch} />
            {pot.closeAt > 0 && ` (${localCloseTime(pot.closeAt)})`}
          </span>
          <Link href="/board" className="underline">
            {pot.totalTickets.toString()} tickets in →
          </Link>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="flex flex-col gap-3">
        {address ? (
          <ComboFlow amountCusd="0.1" pickNumber={comboNumber} />
        ) : (
          <div className="rounded-xl bg-celo-green px-4 py-4 text-center text-lg font-semibold text-white opacity-50">
            Connect to Play
          </div>
        )}

        {address && !pot.loading && (
          <p 
            className="text-center text-sm text-gray-500"
            dangerouslySetInnerHTML={{ __html: t("home.status", { tickets: pot.myTickets.toString(), balance: cusd(pot.myPrincipal) }) }}
          />
        )}

        {address && pot.myTickets > 0n && myPick.number === 0 && (
          <Link
            href="/pick"
            className="rounded-xl border border-celo-gold bg-celo-gold/10 px-4 py-3 text-center font-semibold text-amber-700"
          >
            {t("home.pickPrompt")}
          </Link>
        )}
      </motion.section>

      <motion.footer variants={itemVariants} className="mt-auto text-center text-xs text-gray-400">
        {t("home.footer")}
      </motion.footer>
    </motion.main>
  );
}
