"use client";

import Link from "next/link";

export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 p-6 pb-24 bg-bg-primary text-center">
      <div className="text-5xl">😕</div>
      <h1 className="text-xl font-black text-text-primary">Wallet couldn&apos;t load</h1>
      <p className="text-sm text-text-secondary max-w-xs">
        {error.message || "Something went wrong loading your savings. Your funds are safe on-chain."}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-2xl bg-celo-green px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(53,208,127,0.3)] hover:bg-[#2ebf73] active:scale-95 transition-all"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-bold text-text-primary hover:bg-bg-secondary transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
