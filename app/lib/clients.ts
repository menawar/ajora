import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  type EIP1193Provider,
} from "viem";
import { chain } from "./chain";

/** Shared read client over the public RPC — works with no wallet present. */
export const publicClient = createPublicClient({
  chain,
  transport: http(),
});

declare global {
  interface Window {
    ethereum?: EIP1193Provider & { isMiniPay?: boolean };
  }
}

/** True when running inside MiniPay's webview (its injected provider self-identifies). */
export function isMiniPay(): boolean {
  return typeof window !== "undefined" && Boolean(window.ethereum?.isMiniPay);
}

/** Any injected EIP-1193 provider: MiniPay in production, MetaMask etc. in dev. */
export function injectedProvider(): (EIP1193Provider & { isMiniPay?: boolean }) | undefined {
  return typeof window === "undefined" ? undefined : window.ethereum;
}

// ---- EIP-6963 multi-provider discovery (#113) ----------------------------------
// With several extensions installed (Phantom + MetaMask…), window.ethereum is
// whichever proxy won the injection race — Phantom's interceptor errors before
// MetaMask ever opens. 6963 lets every wallet announce itself; we collect them
// and route the user's pick.

export interface DiscoveredWallet {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: EIP1193Provider;
}

const discovered = new Map<string, DiscoveredWallet>();
let listening = false;

/** Start (idempotently) listening for wallet announcements and re-request them. */
export function discoverWallets(): void {
  if (typeof window === "undefined") return;
  if (!listening) {
    listening = true;
    window.addEventListener("eip6963:announceProvider", (event) => {
      const detail = (event as CustomEvent<DiscoveredWallet>).detail;
      if (detail?.info?.rdns) discovered.set(detail.info.rdns, detail);
    });
  }
  window.dispatchEvent(new Event("eip6963:requestProvider"));
}

export function discoveredWallets(): DiscoveredWallet[] {
  return [...discovered.values()];
}

/** The provider the user actually connected with; writes must go through it. */
let active: EIP1193Provider | undefined;

export function setActiveProvider(provider: EIP1193Provider | undefined, rdns?: string): void {
  active = provider;
  if (typeof window !== "undefined") {
    if (rdns) {
      window.localStorage.setItem("ajora:wallet:rdns", rdns);
    } else if (!provider) {
      window.localStorage.removeItem("ajora:wallet:rdns");
    }
  }
}

export function activeProvider(): (EIP1193Provider & { isMiniPay?: boolean }) | undefined {
  if (active) return active;
  if (typeof window !== "undefined") {
    const saved = window.localStorage.getItem("ajora:wallet:rdns");
    if (saved && discovered.has(saved)) {
      active = discovered.get(saved)!.provider;
      return active;
    }
  }
  return injectedProvider();
}

/** Wallet client over the selected provider; undefined outside a wallet context. */
export function walletClient() {
  const provider = activeProvider();
  if (!provider) return undefined;
  return createWalletClient({ chain, transport: custom(provider) });
}
