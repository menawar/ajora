"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { injectedProvider, isMiniPay } from "../lib/clients";
import { chain } from "../lib/chain";
import { captureRef } from "../lib/share";

type Address = `0x${string}`;

interface WalletState {
  /** Connected account, or undefined. */
  address?: Address;
  /** True when running inside MiniPay's webview. */
  miniPay: boolean;
  /** True while a connect request is in flight. */
  connecting: boolean;
  /** True when no injected provider exists at all (plain mobile browser). */
  noProvider: boolean;
  /** Human-readable reason the last connect attempt failed. */
  error?: string;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

const CHAIN_HEX = `0x${chain.id.toString(16)}`;

/** Move the wallet onto Celo, offering to add the chain when it's unknown (#111). */
async function ensureChain(provider: NonNullable<ReturnType<typeof injectedProvider>>) {
  const current = (await provider.request({ method: "eth_chainId" })) as string;
  if (Number(current) === chain.id) return;
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: CHAIN_HEX }],
    });
  } catch (err) {
    if ((err as { code?: number }).code !== 4902) throw err;
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: CHAIN_HEX,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [chain.rpcUrls.default.http[0]],
          blockExplorerUrls: chain.blockExplorers ? [chain.blockExplorers.default.url] : [],
        },
      ],
    });
  }
}

function connectErrorMessage(err: unknown): string {
  const code = (err as { code?: number }).code;
  if (code === 4001) return "Connection request was declined in the wallet.";
  if (code === -32002) return "A connect request is already open — check your wallet.";
  const msg = err instanceof Error ? err.message.split("\n")[0] : "";
  return msg || "Could not connect the wallet.";
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [connecting, setConnecting] = useState(false);
  const [miniPay, setMiniPay] = useState(false);
  const [noProvider, setNoProvider] = useState(false);
  const [error, setError] = useState<string>();

  const connect = useCallback(async () => {
    const provider = injectedProvider();
    if (!provider) {
      setNoProvider(true);
      return;
    }
    setConnecting(true);
    setError(undefined);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as Address[];
      if (!accounts[0]) throw new Error("The wallet returned no account.");
      // MiniPay is Celo-only; every other wallet may sit on another chain,
      // where connect would "work" but every save/pick/claim would fail.
      if (!isMiniPay()) await ensureChain(provider);
      setAddress(accounts[0]);
    } catch (err) {
      setError(connectErrorMessage(err));
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    captureRef(); // persist ?ref=CODE for later on-chain attribution
    setMiniPay(isMiniPay());

    // MiniPay UX: the wallet is the app shell, so connect silently on open.
    if (isMiniPay()) void connect();

    // Some wallets inject after first paint — don't declare "no provider"
    // until a short grace period has passed (#111).
    let cancelled = false;
    const probe = (attempt: number) => {
      if (cancelled) return;
      if (injectedProvider()) {
        setNoProvider(false);
        attach();
        return;
      }
      if (attempt >= 4) {
        setNoProvider(true);
        return;
      }
      setTimeout(() => probe(attempt + 1), 500);
    };

    const onAccounts = (accounts: unknown) => {
      const list = accounts as Address[];
      setAddress(list[0]);
    };
    const onChain = (chainId: unknown) => {
      // Leaving Celo mid-session: drop the session rather than let writes fail.
      if (Number(chainId as string) !== chain.id && !isMiniPay()) {
        setAddress(undefined);
        setError("Wallet left the Celo network — reconnect to continue.");
      }
    };
    const attach = () => {
      const provider = injectedProvider();
      provider?.on?.("accountsChanged", onAccounts);
      provider?.on?.("chainChanged", onChain);
    };
    probe(0);

    return () => {
      cancelled = true;
      const provider = injectedProvider();
      provider?.removeListener?.("accountsChanged", onAccounts);
      provider?.removeListener?.("chainChanged", onChain);
    };
  }, [connect]);

  const value = useMemo(
    () => ({ address, miniPay, connecting, noProvider, error, connect }),
    [address, miniPay, connecting, noProvider, error, connect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
