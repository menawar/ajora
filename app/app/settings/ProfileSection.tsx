"use client";

import { useWallet } from "../../hooks/useWallet";
import { UserCircle2 } from "lucide-react";

export function ProfileSection() {
  const { address } = useWallet();

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-celo-green/10 text-celo-green">
          <UserCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Profile</h2>
          <p className="text-xs text-gray-500 font-mono">
            {address ? \`\${address.slice(0, 6)}...\${address.slice(-4)}\` : "Not connected"}
          </p>
        </div>
      </div>
    </section>
  );
}
