import { toDataSuffix, codeFromHostname } from "@celo/attribution-tags";
import type { Hex } from "viem";

let cached: Hex | null = null;

export function getAttributionSuffix(): Hex | undefined {
  if (typeof window === "undefined") return undefined;
  if (cached) return cached;
  try {
    cached = toDataSuffix(codeFromHostname(window.location.hostname)) as Hex;
    return cached;
  } catch {
    return undefined;
  }
}
