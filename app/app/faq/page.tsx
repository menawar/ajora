import Link from "next/link";
import { AccordionItem } from "../../components/ui/Accordion";

/**
 * The trust page (#96, spec §6): why Ajora is not a Ponzi, stated plainly.
 * Static server component — no wallet, no fetches, loads instantly.
 */
export default function Faq() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24">
      <header>
        <h1 className="text-2xl font-bold">How Ajora keeps your money safe</h1>
        <p className="mt-1 text-gray-500">Three promises, all enforced by code on Celo.</p>
      </header>

      <div className="flex flex-col gap-3">
        <AccordionItem title="1. Your savings are never at risk" defaultOpen>
          Every cent you save can be withdrawn, always. Prizes are paid from a separate
          pot — the contract physically cannot spend your savings on prizes. Worst case,
          you win nothing and withdraw exactly what you put in.
        </AccordionItem>

        <AccordionItem title="2. Prizes come from outside money">
          The jara pot is funded by interest earned on the pooled savings, sponsor
          campaigns, and fees from optional paid pots — never by later savers&apos;
          deposits. That is the opposite of a Ponzi, where old players are paid with new
          players&apos; money.
        </AccordionItem>

        <AccordionItem title="3. Payouts can never exceed real revenue">
          The contract caps each day&apos;s prizes at what the pot actually holds. There
          is no promised return, no fixed &quot;APY&quot;, nothing that can run dry —
          prizes are a share of real money already in the pot.
        </AccordionItem>

        <AccordionItem title="Check it yourself">
          Every draw publishes its random seed on-chain, every contract is verified and
          open source, and the live pot is readable by anyone. Don&apos;t trust — verify.
        </AccordionItem>
      </div>

      <Link href="/" className="mt-4 text-center text-sm font-semibold text-celo-green underline transition hover:text-[#2ebf73]">
        ← Back to today&apos;s pot
      </Link>
    </main>
  );
}
