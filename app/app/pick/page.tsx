"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ConnectBar } from "../../components/ConnectBar";
import { useTranslation } from "../../lib/i18n";
import { useDraw } from "../../hooks/useDraw";
import { usePotToday } from "../../hooks/usePotVault";
import { useWallet } from "../../hooks/useWallet";
import { useToast } from "../../hooks/useToast";

const NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

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
      toast(t("pick.success"), "success");
      setSelected(undefined); // Clear selection after successful pick
    }
  }, [myPick.number, selected, t, toast]);

  const hasTickets = pot.myTickets > 0n;
  const active = selected ?? myPick.number;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{t("pick.title")}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {hasTickets ? (
            <span dangerouslySetInnerHTML={{ __html: t("pick.subtitle.tickets", { tickets: pot.myTickets.toString() }) }} />
          ) : (
            t("pick.subtitle.empty")
          )}
        </p>
      </header>

      <ConnectBar />

      <section
        className="grid grid-cols-3 gap-3"
        role="group"
        aria-label={t("pick.number_pad", { defaultValue: "Number pad" })}
      >
        {NUMBERS.map((n) => (
          <button
            key={n}
            type="button"
            disabled={!hasTickets || picking}
            onClick={() => setSelected(n)}
            aria-label={`Pick number ${n}`}
            aria-pressed={active === n}
            className={`aspect-square rounded-2xl border text-3xl font-bold transition-all focus:outline-none focus:ring-4 focus:ring-celo-green/50 active:scale-95 ${
              active === n
                ? "border-celo-green bg-celo-green text-white"
                : "border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            }`}
          >
            {n}
          </button>
        ))}
      </section>

      {myPick.number !== 0 && (
        <p className="text-center text-sm text-gray-500">
          <span dangerouslySetInnerHTML={{ __html: t("pick.current", { number: myPick.number.toString(), weight: myPick.weight.toString() }) }} />
          {selected && selected !== myPick.number && t("pick.current.replaces")}
        </p>
      )}

      {hasTickets ? (
        <button
          type="button"
          disabled={!selected || picking || selected === myPick.number}
          onClick={() => selected && void pick(selected)}
          className="rounded-xl bg-celo-green px-4 py-4 text-lg font-semibold text-white transition active:scale-[0.99] disabled:opacity-50"
        >
          {picking
            ? t("pick.locking")
            : myPick.number !== 0
              ? t("pick.update")
              : t("pick.submit")}
        </button>
      ) : (
        <Link
          href="/save"
          className="rounded-xl bg-celo-green px-4 py-4 text-center text-lg font-semibold text-white"
        >
          {t("pick.cta.save")}
        </Link>
      )}

      {error && <p className="text-center text-sm text-red-500">{error}</p>}

      <footer className="mt-auto text-center text-xs text-gray-400">
        {t("pick.footer")}
      </footer>
    </main>
  );
}
