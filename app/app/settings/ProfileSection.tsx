"use client";

import { useWallet } from "../../hooks/useWallet";
import { UserCircle2, Copy, CheckCircle2, ShieldCheck, Wallet, Trophy, ChevronRight, Palette } from "lucide-react";
import { SettingsGroup } from "../../components/ui/SettingsGroup";
import { ToggleItem } from "../../components/ui/ToggleItem";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileSection() {
  const { address } = useWallet();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SettingsGroup title="Account" delay={0.1}>
      <ToggleItem
        icon={<UserCircle2 className="w-5 h-5" />}
        title="Profile"
        description={address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Not connected"}
        action={
          address && (
            <button
              onClick={handleCopyAddress}
              className="p-2 rounded-xl bg-bg-secondary text-text-muted hover:text-celo-green hover:bg-celo-green/10 transition-colors"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-celo-green" /> : <Copy className="w-4 h-4" />}
            </button>
          )
        }
      />
      <ToggleItem
        icon={<ShieldCheck className="w-5 h-5" />}
        title="Verification Status"
        description="Verified by MiniPay"
        action={<span className="text-xs font-bold text-celo-green bg-celo-green/10 px-2 py-1 rounded-md">Verified</span>}
      />
      <ToggleItem
        icon={<Wallet className="w-5 h-5" />}
        title="Connected Wallet"
        description="MiniPay Smart Wallet"
        action={null}
      />
      <ToggleItem
        icon={<Trophy className="w-5 h-5 text-celo-gold" />}
        title="Trophy Room"
        description="View your unlocked achievements"
        action={<ChevronRight className="w-5 h-5 text-text-muted" />}
        onClick={() => router.push("/achievements")}
      />
      <ToggleItem
        icon={<Palette className="w-5 h-5 text-purple-500" />}
        title="App Themes"
        description="Customize your experience"
        action={<ChevronRight className="w-5 h-5 text-text-muted" />}
        onClick={() => router.push("/themes")}
        borderBottom={false}
      />
    </SettingsGroup>
  );
}
