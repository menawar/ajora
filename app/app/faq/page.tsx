"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { AccordionItem } from "../../components/ui/Accordion";
import { Input } from "../../components/ui/Input";
import { GlossaryTooltip } from "../../components/ui/GlossaryTooltip";

const FAQ_DATA = [
  {
    category: "General",
    q: "Is my money safe?",
    a: (
      <>
        Yes, your savings are never at risk. Every cent you save can be withdrawn, always. 
        Prizes are paid from a separate pot. The contract physically cannot spend your savings on prizes. 
        Worst case, you win nothing and withdraw exactly what you put in.
      </>
    )
  },
  {
    category: "General",
    q: "How are prizes funded?",
    a: (
      <>
        The <GlossaryTooltip term="jara pot" definition="The daily prize pool available to be won." /> is funded 
        by yield earned on pooled savings across DeFi protocols, sponsor campaigns, and small fees from optional paid pots. 
        It is never funded by later savers&apos; deposits.
      </>
    )
  },
  {
    category: "Mechanics",
    q: "How do I win?",
    a: (
      <>
        You earn <GlossaryTooltip term="Tickets" definition="Chances to win in the daily draw. 1 cUSD saved = 1 base ticket." /> 
        by saving. Every day at 20:00 UTC, a random winning number (1-9) is drawn by the 
        <GlossaryTooltip term="Keeper" definition="An automated backend script that triggers the draw and harvests yield." />. 
        If your picked number matches, your tickets receive a proportional share of the pot!
      </>
    )
  },
  {
    category: "Mechanics",
    q: "What is a Streak?",
    a: (
      <>
        A <GlossaryTooltip term="Streak" definition="Consecutive days where you have made at least one save." /> 
        multiplies your earned tickets! A 2-day streak gives a 1.2x multiplier, up to a massive 3x multiplier 
        for saving 7 days in a row. Don&apos;t break it!
      </>
    )
  },
  {
    category: "Rewards",
    q: "How do I claim my winnings?",
    a: (
      <>
        Winnings automatically accrue to your wallet&apos;s internal Ajora balance. You can see your 
        unclaimed winnings on the Wallet page and tap &quot;Claim&quot; to withdraw them straight to your MiniPay wallet as cUSD.
      </>
    )
  },
  {
    category: "Rewards",
    q: "How do crews work?",
    a: (
      <>
        Share your unique invite code with friends to form a <GlossaryTooltip term="Crew" definition="A group of players linked by referrals." />. 
        Crews let you see your friends&apos; savings progress. Future updates will introduce crew-level goals and shared bonuses!
      </>
    )
  }
];

const CATEGORIES = ["All", "General", "Mechanics", "Rewards"];

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesSearch = item.q.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6 pb-24 bg-bg-primary">
      <header className="pt-4 text-center">
        <h1 className="text-3xl font-black tracking-tight text-gradient">Knowledge Base</h1>
        <p className="mt-2 text-sm text-text-secondary">Everything you need to know about Ajora.</p>
      </header>

      <div className="relative z-20">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch("")}
          prefixNode={<Search className="w-5 h-5" />}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 mask-edges">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              activeCategory === cat 
                ? "bg-text-primary text-bg-primary shadow-md" 
                : "bg-bg-secondary text-text-secondary hover:text-text-primary"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 relative z-10 min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                layout
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <AccordionItem title={faq.q}>
                  {faq.a}
                </AccordionItem>
              </motion.div>
            ))
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-bold text-text-primary mb-1">No results found</h3>
              <p className="text-sm text-text-muted">We couldn&apos;t find an answer for &quot;{search}&quot;</p>
              <button 
                onClick={() => setSearch("")}
                className="mt-4 text-sm font-bold text-celo-green hover:text-[#2ebf73] px-4 py-2 bg-celo-green/10 rounded-xl"
              >
                Clear Search
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link href="/" className="mt-8 text-center text-sm font-bold text-celo-green underline decoration-celo-green/30 decoration-dotted underline-offset-4 transition hover:text-[#2ebf73]">
        ← Back to today&apos;s pot
      </Link>
    </main>
  );
}
