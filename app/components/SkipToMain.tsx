"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SkipToMain() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <a
      href="#main-content"
      className="absolute left-4 top-4 z-50 -translate-y-[150%] rounded-xl bg-celo-green px-4 py-2 font-bold text-white opacity-0 transition-all focus:translate-y-0 focus:opacity-100"
    >
      Skip to main content
    </a>
  );
}
