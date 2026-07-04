"use client";

import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { ConnectBar } from "../../components/ConnectBar";
import { publicClient } from "../../lib/clients";
import { contracts } from "../../lib/contracts";
import { useSave } from "../../hooks/usePotVault";
import { useStreak } from "../../hooks/useStreak";
import { useWallet } from "../../hooks/useWallet";

const PRESETS = ["0.1", "0.5", "1"] as const;
const MIN = parseUnits("0.1", 18);

export default function SavePage() {
  const { address } = useWallet();
  const { save, status, reset } = useSave();
  const { multiplierX10 } = useStreak();

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Save</h1>
        <p className="mt-1 text-sm text-gray-500">
          Keep every cent — savings are always withdrawable.
        </p>
      </header>

      <ConnectBar />

      <section className="flex flex-col gap-3">
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setCustom(false);
                setAmount(p);
                reset();
              }}
              className={`rounded-xl border py-3 font-semibold ${
                !custom && amount === p
                  ? "border-celo-green bg-celo-green/10 text-celo-green"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setCustom(true);
              setAmount("");
              reset();
            }}
            className={`rounded-xl border py-3 font-semibold ${
              custom
                ? "border-celo-green bg-celo-green/10 text-celo-green"
                : "border-gray-200 text-gray-600"
            }`}
          >
            …
          </button>
        </div>

        {custom && (
          <input
            inputMode="decimal"
            placeholder="Amount in cUSD (min 0.10)"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="rounded-xl border border-gray-200 px-4 py-3 text-lg outline-celo-green"
          />
        )}

        <div className="flex justify-between text-sm text-gray-500">
          <span>
            {balance !== undefined &&
              `Balance: ${Number(formatUnits(balance, 18)).toFixed(2)} cUSD`}
          </span>
          <span>
            {parsed >= MIN && (
              <>
                → <strong>{tickets.toString()}</strong> tickets
                {multiplierX10 > 10n && " (streak boost!)"}
              </>
            )}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            reset();
            void save(amount);
          }}
          disabled={busy || !address || parsed < MIN || insufficient}
          className="rounded-xl bg-celo-green px-4 py-4 text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {status.step === "approving"
            ? "Approving cUSD…"
            : status.step === "saving"
              ? "Saving…"
              : `Save ${amount || "…"} cUSD`}
        </button>

        {tooSmall && <p className="text-center text-sm text-amber-600">Minimum is 0.10 cUSD.</p>}
        {insufficient && (
          <p className="text-center text-sm text-amber-600">Not enough cUSD in your wallet.</p>
        )}
        {status.step === "success" && (
          <p className="text-center text-sm text-celo-green">
            Saved! +{status.tickets.toString()} tickets. Now pick your lucky number 🎯
          </p>
        )}
        {status.step === "error" && (
          <div className="text-center text-sm">
            <p className="text-red-500">{status.message}</p>
            <button type="button" onClick={() => void save(amount)} className="mt-1 underline">
              Retry
            </button>
          </div>
        )}
      </section>

      <footer className="mt-auto text-center text-xs text-gray-400">
        More saved = more tickets. Streaks multiply your tickets up to 3x.
      </footer>
    </main>
  );
}
