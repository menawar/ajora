import Link from "next/link";

/**
 * The trust page (#96, spec §6): why Ajora is not a Ponzi, stated plainly.
 * Static server component — no wallet, no fetches, loads instantly.
 */
export default function Faq() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header>
        <h1 className="text-2xl font-bold">How Ajora keeps your money safe</h1>
        <p className="mt-1 text-gray-500">Three promises, all enforced by code on Celo.</p>
      </header>

      <section className="rounded-2xl bg-gray-50 p-4">
        <h2 className="font-semibold">1. Your savings are never at risk</h2>
        <p className="mt-1 text-sm text-gray-600">
          Every cent you save can be withdrawn, always. Prizes are paid from a separate
          pot — the contract physically cannot spend your savings on prizes. Worst case,
          you win nothing and withdraw exactly what you put in.
        </p>
      </section>

      <section className="rounded-2xl bg-gray-50 p-4">
        <h2 className="font-semibold">2. Prizes come from outside money</h2>
        <p className="mt-1 text-sm text-gray-600">
          The jara pot is funded by interest earned on the pooled savings, sponsor
          campaigns, and fees from optional paid pots — never by later savers&apos;
          deposits. That is the opposite of a Ponzi, where old players are paid with new
          players&apos; money.
        </p>
      </section>

      <section className="rounded-2xl bg-gray-50 p-4">
        <h2 className="font-semibold">3. Payouts can never exceed real revenue</h2>
        <p className="mt-1 text-sm text-gray-600">
          The contract caps each day&apos;s prizes at what the pot actually holds. There
          is no promised return, no fixed &quot;APY&quot;, nothing that can run dry —
          prizes are a share of real money already in the pot.
        </p>
      </section>

      <section className="rounded-2xl bg-gray-50 p-4">
        <h2 className="font-semibold">Check it yourself</h2>
        <p className="mt-1 text-sm text-gray-600">
          Every draw publishes its random seed on-chain, every contract is verified and
          open source, and the live pot is readable by anyone. Don&apos;t trust — verify.
        </p>
      </section>

      <Link href="/" className="text-center text-sm text-celo-green underline">
        ← Back to today&apos;s pot
      </Link>
    </main>
  );
}
