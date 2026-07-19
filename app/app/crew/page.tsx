"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { ConnectBar } from "../../components/ConnectBar";
import { useCrew } from "../../hooks/useCrew";
import { useSpray } from "../../hooks/useSpray";
import { useWallet } from "../../hooks/useWallet";
import { shareUrl, storedRef } from "../../lib/share";
import { EmptyState } from "../../components/ui/EmptyState";
import { Users2 } from "lucide-react";

function cusd(v: bigint): string {
  return Number(formatUnits(v, 18)).toLocaleString("en", { maximumFractionDigits: 2 });
}

function SpraySection() {
  const { address } = useWallet();
  const { spraysLeft, dailyFreeLeft, spray, spraying, done, error } = useSpray();
  const [friend, setFriend] = useState("");

  if (!address) return null;

  return (
    <section className="rounded-2xl border border-gray-100 p-5">
      <h2 className="font-semibold">Spray a friend 🎉</h2>
      <p className="mt-1 text-sm text-gray-500">
        Gift a free ticket — costs you nothing, the sponsor pays.{" "}
        <strong>{spraysLeft.toString()}</strong> sprays left to send today.
      </p>
      {dailyFreeLeft === 0n && (
        <p className="mt-2 text-xs font-semibold text-amber-600 bg-amber-50 p-2 rounded-lg">
          ⚠️ You have reached your daily limit of free tickets. Friends cannot spray you until tomorrow.
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <input
          placeholder="Friend's wallet address 0x…"
          value={friend}
          onChange={(e) => setFriend(e.target.value.trim())}
          className="min-w-0 flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-celo-green"
        />
        <button
          type="button"
          disabled={spraying || spraysLeft === 0n || !friend}
          onClick={() => void spray(friend)}
          className="rounded-xl bg-celo-gold px-4 py-2.5 font-semibold text-white disabled:opacity-50"
        >
          {spraying ? "…" : "Spray"}
        </button>
      </div>
      {done && (
        <p className="mt-2 animate-bounce text-center text-lg">🎉 🎊 🎉 Sprayed! 🎉 🎊 🎉</p>
      )}
      {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}
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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">Your crew</h1>
        <p className="mt-1 text-sm text-gray-500">
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
        <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
      ) : crew.crewId === 0n ? (
        <section className="rounded-2xl border border-gray-100 p-5">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("join")}
              className={`rounded-xl border py-2 text-sm font-semibold ${mode === "join" ? "border-celo-green bg-celo-green/10 text-celo-green" : "border-gray-200 text-gray-500"}`}
            >
              Join a crew
            </button>
            <button
              type="button"
              onClick={() => setMode("create")}
              className={`rounded-xl border py-2 text-sm font-semibold ${mode === "create" ? "border-celo-green bg-celo-green/10 text-celo-green" : "border-gray-200 text-gray-500"}`}
            >
              Start a crew
            </button>
          </div>
          {mode === "join" && (
            <input
              placeholder="Inviter's code"
              value={inviter}
              onChange={(e) => setInviter(e.target.value)}
              className="mb-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-celo-green"
            />
          )}
          <input
            placeholder="Choose your own code (e.g. amara-lagos)"
            value={myCode}
            onChange={(e) => setMyCode(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-celo-green"
          />
          <button
            type="button"
            disabled={crew.busy || !address || !myCode || (mode === "join" && !inviter)}
            onClick={() =>
              void (mode === "join" ? crew.joinCrew(inviter, myCode) : crew.createCrew(myCode))
            }
            className="mt-3 w-full rounded-xl bg-celo-green px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {crew.busy ? "Confirming…" : mode === "join" ? "Join crew" : "Create crew"}
          </button>
          {crew.error && <p className="mt-2 text-center text-sm text-red-500">{crew.error}</p>}
        </section>
      ) : (
        <section className="rounded-2xl bg-gradient-to-br from-celo-green to-celo-gold p-5 text-white">
          <div className="flex justify-between text-sm opacity-90">
            <span>Crew #{crew.crewId.toString()}</span>
            <span>{crew.memberCount.toString()} members</span>
          </div>
          <div className="mt-1 text-2xl font-bold">{cusd(crew.savingsToday)} cUSD saved today</div>
          <div className="mt-3 rounded-xl bg-white/20 p-3 text-center">
            <div className="text-xs opacity-90">Your invite code</div>
            <div className="text-xl font-bold">{crew.myCode}</div>
          </div>
          <button
            type="button"
            onClick={() =>
              void navigator.share?.({
                text: `Join my Ajora crew — save small, keep every cent, win the daily draw. Code: ${crew.myCode}`,
                url: inviteLink,
              }).catch(() => navigator.clipboard?.writeText(inviteLink))
            }
            className="mt-3 w-full rounded-xl bg-white px-4 py-3 font-semibold text-celo-green"
          >
            Share invite link
          </button>
        </section>
      )}

      {crew.members && crew.members.length > 0 && (
        <section className="rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold mb-3">Crew Members</h2>
          <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
            {crew.members.map((m) => (
              <div key={m.address} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg text-sm">
                <span className="font-mono text-gray-700">{m.address.slice(0, 8)}…{m.address.slice(-6)}</span>
                <span className="text-gray-400 text-xs">{new Date(m.joinedAt * 1000).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <SpraySection />

      <footer className="mt-auto text-center text-xs text-gray-400">
        Invites earn a bonus ticket after your friend saves on 3 different days.
      </footer>
    </main>
  );
}
