"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { storedRef } from "../lib/share";
import { useWelcome } from "../hooks/useWelcome";
import { useWallet } from "../hooks/useWallet";

const SEEN_KEY = "ajora.onboarded";

import { ErrorAlert } from "./ui/ErrorAlert";

/**
 * First-run zero-deposit onboarding (AJORA_SPEC.md §11): explain no-loss in one
 * screen, hand over the sponsored welcome ticket, route to Pick. Unverified
 * accounts get an honest pending state with the save-instead path — never a
 * dead end.
 */
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

  // if (!open) return null;

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
        >
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="mx-auto w-full max-w-md rounded-t-3xl bg-white p-6 sm:rounded-3xl"
          >
        <h2 className="text-center text-2xl font-bold">Welcome to Ajora 🎉</h2>
        {ref && (
          <p className="mt-1 text-center text-sm text-celo-green">
            Invited by <strong>{ref}</strong>
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-3 text-sm text-gray-600">
          <li className="flex gap-2">
            <span>💰</span> Save a little cUSD each day — <strong>keep every cent</strong>,
            withdraw any time after the day closes.
          </li>
          <li className="flex gap-2">
            <span>🎯</span> Savings earn tickets. Pick a number, win the nightly jara pot.
          </li>
          <li className="flex gap-2">
            <span>🔥</span> Daily streaks multiply your tickets up to 3x.
          </li>
        </ul>

        <div className="mt-5 flex flex-col gap-2">
          {claimedNow || welcomed ? (
            <>
              <p className="text-center text-sm font-medium text-celo-green">
                Your free ticket is in tonight&apos;s draw 🎟️
              </p>
              <Link
                href="/pick"
                onClick={dismiss}
                className="rounded-xl bg-celo-green px-4 py-3.5 text-center font-semibold text-white"
              >
                Pick your lucky number
              </Link>
            </>
          ) : showClaim ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              disabled={claiming}
              onClick={() =>
                void claim().then(() => {
                  setClaimedNow(true);
                })
              }
              className="rounded-xl bg-celo-green px-4 py-3.5 font-semibold text-white disabled:opacity-50"
            >
              {claiming ? "Claiming…" : "Claim your FREE ticket 🎟️"}
            </motion.button>
          ) : showPending ? (
            <>
              <p className="text-center text-xs text-gray-500">
                Your free ticket unlocks once your account is verified — meanwhile you can
                start saving right away.
              </p>
              <Link
                href="/save"
                onClick={dismiss}
                className="rounded-xl bg-celo-green px-4 py-3.5 text-center font-semibold text-white"
              >
                Save 0.10 cUSD to start
              </Link>
            </>
          ) : (
            <p className="text-center text-xs text-gray-500">
              {miniPay || address ? "Loading your account…" : "Open Ajora inside MiniPay to get your free ticket."}
            </p>
          )}
          {error && <div className="mt-2"><ErrorAlert message={error} /></div>}
          <button type="button" onClick={dismiss} className="py-2 text-sm text-gray-400 mt-1">
            Maybe later
          </button>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
