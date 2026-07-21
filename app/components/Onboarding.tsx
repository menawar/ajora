"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Target, Trophy, ArrowRight } from "lucide-react";
import { storedRef } from "../lib/share";
import { useWelcome } from "../hooks/useWelcome";
import { useWallet } from "../hooks/useWallet";
import { ErrorAlert } from "./ui/ErrorAlert";
import { Carousel } from "./ui/Carousel";
import { OnboardingStep } from "./OnboardingStep";
import { triggerSmallConfetti } from "../lib/confetti";

const SEEN_KEY = "ajora.onboarded";

export function Onboarding() {
  const { address, miniPay } = useWallet();
  const { welcomed, verified, loading, claim, claiming, error } = useWelcome();
  const [open, setOpen] = useState(false);
  const [claimedNow, setClaimedNow] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(SEEN_KEY)) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  const ref = storedRef();
  const showClaim = address && !loading && !welcomed && verified;
  const showPending = address && !loading && !welcomed && !verified;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-0"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md bg-bg-primary rounded-[2rem] overflow-hidden shadow-2xl relative border border-gray-100 dark:border-gray-800"
          >
            <Carousel onComplete={() => triggerSmallConfetti()}>
              <OnboardingStep
                title="Save without risk"
                subtitle="Every cent you save on Ajora stays yours. Withdraw it anytime with zero fees."
                icon={<Wallet className="w-16 h-16" strokeWidth={1.5} />}
                highlightColor="green"
              />
              <OnboardingStep
                title="Pick a number"
                subtitle="Your savings earn you tickets. Pick a number from 1 to 9 to enter the daily draw."
                icon={<Target className="w-16 h-16" strokeWidth={1.5} />}
                highlightColor="purple"
              />
              <OnboardingStep
                title="Win every night"
                subtitle="If your number hits, you win a share of the jara pot! Real Celo Dollars paid daily."
                icon={<Trophy className="w-16 h-16" strokeWidth={1.5} />}
                highlightColor="gold"
              />
            </Carousel>

            <div className="px-6 pb-6 pt-2">
              {ref && (
                <div className="text-center text-xs font-semibold text-celo-green mb-3 bg-celo-green/10 py-1.5 rounded-full inline-block px-3 w-full">
                  Invited by {ref.slice(0, 8)}...
                </div>
              )}

              <div className="flex flex-col gap-2">
                {claimedNow || welcomed ? (
                  <>
                    <p className="text-center text-xs font-bold text-celo-green mb-1">
                      Your free ticket is in tonight&apos;s draw 🎟️
                    </p>
                    <Link
                      href="/pick"
                      onClick={dismiss}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-celo-green px-4 py-3.5 font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] hover:bg-[#2ebf73] transition-all active:scale-95 w-full"
                    >
                      Pick your lucky number <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : showClaim ? (
                  <button
                    type="button"
                    disabled={claiming}
                    onClick={() =>
                      void claim().then(() => {
                        setClaimedNow(true);
                      })
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl bg-celo-green px-4 py-3.5 font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] hover:bg-[#2ebf73] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none w-full"
                  >
                    {claiming ? "Claiming…" : "Claim your FREE ticket 🎟️"}
                  </button>
                ) : showPending ? (
                  <>
                    <p className="text-center text-[11px] font-medium text-text-muted mb-2 px-4 leading-tight">
                      Your free ticket unlocks once verified. Start saving now to earn more tickets.
                    </p>
                    <Link
                      href="/save"
                      onClick={dismiss}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-celo-green px-4 py-3.5 font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] hover:bg-[#2ebf73] transition-all active:scale-95 w-full"
                    >
                      Save to start <ArrowRight className="w-4 h-4" />
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-center text-xs font-semibold text-text-muted">
                      {miniPay || address ? "Loading account…" : "Open Ajora in MiniPay for a free ticket."}
                    </p>
                    <button
                      onClick={dismiss}
                      className="rounded-2xl border-2 border-gray-100 dark:border-gray-800 px-4 py-3 font-bold text-text-primary hover:bg-bg-secondary transition-colors w-full"
                    >
                      Start saving anyway
                    </button>
                  </div>
                )}
                {error && <div className="mt-2"><ErrorAlert message={error} /></div>}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
