"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { ConnectBar } from "../../components/ConnectBar";
import { useCrew } from "../../hooks/useCrew";
import { useSpray } from "../../hooks/useSpray";
import { useWallet } from "../../hooks/useWallet";
import { shareUrl, storedRef } from "../../lib/share";
import { EmptyState } from "../../components/ui/EmptyState";
import { Users2, Send } from "lucide-react";
import { trackEvent, AnalyticsEvents } from "../../lib/analytics";
import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Skeleton } from "../../components/ui/Skeleton";

function cusd(v: bigint): string {
  return Number(formatUnits(v, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function SpraySection() {
  const { address } = useWallet();
  const { spraysLeft, dailyFreeLeft, spray, spraying, done, error } = useSpray();
  const [friend, setFriend] = useState("");

  useEffect(() => {
    if (done) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.7 },
        colors: ['#35d07f', '#fbcc5c', '#ea580c']
      });
      trackEvent(AnalyticsEvents.SPRAY_COMPLETED, { friend });
    }
  }, [done, friend]);

  if (!address) return null;

  return (
    <section className="glass-panel rounded-3xl p-6 mt-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Send className="w-32 h-32" />
      </div>
      <h2 className="text-lg font-bold text-text-primary">Spray a friend 🎉</h2>
      <p className="mt-1 text-sm text-text-secondary leading-relaxed">
        Gift a free ticket — costs you nothing, the sponsor pays.{" "}
        <strong className="text-text-primary">{spraysLeft.toString()}</strong> sprays left to send today.
      </p>
      {dailyFreeLeft === 0n && (
        <p className="mt-3 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-100 p-3 rounded-xl">
          ⚠️ You have reached your daily limit of free tickets. Friends cannot spray you until tomorrow.
        </p>
      )}
      <div className="mt-4 flex gap-2 relative z-10">
        <input
          placeholder="Friend's wallet address 0x…"
          value={friend}
          onChange={(e) => setFriend(e.target.value.trim())}
          className="min-w-0 flex-1 rounded-2xl bg-bg-secondary border-none px-4 py-3 text-sm focus:ring-2 focus:ring-celo-green outline-none transition-all placeholder:text-text-muted"
        />
        <button
          type="button"
          disabled={spraying || spraysLeft === 0n || !friend}
          onClick={() => {
            trackEvent(AnalyticsEvents.SPRAY_INITIATED, { friend });
            void spray(friend);
          }}
          className="rounded-2xl bg-celo-gold px-5 py-3 font-bold text-white shadow-md disabled:opacity-50 hover:bg-[#eab308] hover:shadow-lg transition-all active:scale-95"
        >
          {spraying ? "…" : "Spray"}
        </button>
      </div>
      {done && (
        <p className="mt-4 animate-bounce text-center text-lg font-bold text-celo-green">🎉 🎊 🎉 Sprayed! 🎉 🎊 🎉</p>
      )}
      {error && <p className="mt-3 text-center text-sm font-semibold text-red-500 bg-red-50 p-2 rounded-lg">{error}</p>}
    </section>
  );
}

export default function CrewPage() {
  const { address } = useWallet();
  const crew = useCrew();
  const [inviter, setInviter] = useState(storedRef() ?? "");
  const [myCode, setMyCode] = useState("");
  const [mode, setMode] = useState<"join" | "create">(storedRef() ? "join" : "create");

  const inviteLink = crew.myCode ? shareUrl(crew.myCode) : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 p-6 pb-24 bg-bg-primary">
      <header className="text-center pt-4">
        <h1 className="text-3xl font-black tracking-tight text-text-primary text-gradient">Your Crew</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Bigger crew, bigger pots — recruit with your code.
        </p>
      </header>

      <ConnectBar />

      {!crew.enabled ? (
        <EmptyState
          title="Coming Soon 🚀"
          description="Your invite link and crew pots are on the way. Spraying already works below."
          icon={<Users2 className="h-6 w-6" />}
        />
      ) : crew.loading ? (
        <Skeleton className="h-48 w-full rounded-3xl" />
      ) : crew.crewId === 0n ? (
        <section className="glass-panel rounded-3xl p-6">
          <div className="mb-4 bg-bg-secondary p-1 rounded-2xl flex">
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "join" ? "bg-white text-celo-green shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Join a crew
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${mode === "create" ? "bg-white text-celo-green shadow-sm" : "text-text-muted hover:text-text-primary"}`}
            >
              Start a crew
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {mode === "join" && (
              <input
                placeholder="Inviter's code"
                value={inviter}
                onChange={(e) => setInviter(e.target.value)}
                className="w-full rounded-2xl bg-bg-secondary border-none px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-celo-green transition-all"
              />
            )}
            <input
              placeholder="Choose your own code (e.g. amara-lagos)"
              value={myCode}
              onChange={(e) => setMyCode(e.target.value)}
              className="w-full rounded-2xl bg-bg-secondary border-none px-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-celo-green transition-all"
            />
            <button
              type="button"
              disabled={crew.busy || !address || !myCode || (mode === "join" && !inviter)}
              onClick={() =>
                void (mode === "join" ? crew.joinCrew(inviter, myCode) : crew.createCrew(myCode))
              }
              className="mt-2 w-full rounded-2xl bg-celo-green px-4 py-3.5 font-bold text-white shadow-[0_4px_14px_0_rgba(53,208,127,0.39)] hover:shadow-[0_6px_20px_rgba(53,208,127,0.23)] hover:bg-[#2ebf73] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {crew.busy ? "Confirming…" : mode === "join" ? "Join Crew" : "Create Crew"}
            </button>
          </div>
          {crew.error && <p className="mt-4 text-center text-sm font-semibold text-red-500 bg-red-50 p-2 rounded-lg">{crew.error}</p>}
        </section>
      ) : (
        <section className="rounded-3xl bg-gradient-to-br from-celo-green via-[#2ebf73] to-celo-gold p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between text-sm font-medium opacity-90 relative z-10">
            <span className="bg-white/20 px-2 py-1 rounded-md">Crew #{crew.crewId.toString()}</span>
            <span className="flex items-center gap-1"><Users2 className="w-4 h-4" /> {crew.memberCount.toString()} members</span>
          </div>
          <div className="mt-4 mb-2 relative z-10">
            <div className="text-4xl font-black tracking-tight drop-shadow-md">{cusd(crew.savingsToday)} <span className="text-xl font-bold opacity-80 uppercase tracking-wide">cUSD</span></div>
            <div className="text-sm font-medium opacity-90 mt-1">Saved by crew today</div>
          </div>
          <div className="mt-6 rounded-2xl bg-white/15 backdrop-blur-md p-4 text-center border border-white/20 relative z-10">
            <div className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-1">Your Invite Code</div>
            <div className="text-2xl font-black tracking-widest">{crew.myCode}</div>
          </div>
          <button
            type="button"
            onClick={() =>
              void navigator.share?.({
                text: `Join my Ajora crew — save small, keep every cent, win the daily draw. Code: ${crew.myCode}`,
                url: inviteLink,
              }).catch(() => navigator.clipboard?.writeText(inviteLink))
            }
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3.5 font-bold text-celo-green shadow-lg hover:bg-gray-50 active:scale-95 transition-all relative z-10"
          >
            Share Invite Link
          </button>
        </section>
      )}

      {crew.members && crew.members.length > 0 && (
        <section className="glass-panel rounded-3xl p-5">
          <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <Users2 className="w-5 h-5 text-celo-green" /> Crew Roster
          </h2>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {crew.members.map((m) => (
              <div key={m.address} className="flex justify-between items-center bg-bg-secondary p-3 rounded-xl text-sm border border-transparent hover:border-gray-200 transition-colors">
                <span className="font-mono font-medium text-text-primary bg-white px-2 py-1 rounded-md shadow-sm">
                  {m.address.slice(0, 6)}…{m.address.slice(-4)}
                </span>
                <span className="text-text-muted text-xs font-medium">Joined {new Date(m.joinedAt * 1000).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <SpraySection />

      <footer className="mt-auto text-center text-xs text-text-muted font-medium">
        Invites earn a bonus ticket after your friend saves on 3 different days.
      </footer>
    </main>
  );
}

