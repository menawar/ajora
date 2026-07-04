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

/** Wallet client over the injected provider; undefined outside a wallet context. */
export function walletClient() {
  const provider = injectedProvider();
  if (!provider) return undefined;
  return createWalletClient({ chain, transport: custom(provider) });
}
