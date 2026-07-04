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
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [connecting, setConnecting] = useState(false);
  const [miniPay, setMiniPay] = useState(false);
  const [noProvider, setNoProvider] = useState(false);

  const connect = useCallback(async () => {
    const provider = injectedProvider();
    if (!provider) {
      setNoProvider(true);
      return;
    }
    setConnecting(true);
    try {
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as Address[];
      setAddress(accounts[0]);
    } finally {
      setConnecting(false);
    }
  }, []);

  useEffect(() => {
    const provider = injectedProvider();
    setNoProvider(!provider);
    setMiniPay(isMiniPay());

    // MiniPay UX: the wallet is the app shell, so connect silently on open.
    if (isMiniPay()) void connect();

    // Track account changes from the wallet side.
    const onAccounts = (accounts: unknown) => {
      const list = accounts as Address[];
      setAddress(list[0]);
    };
    provider?.on?.("accountsChanged", onAccounts);
    return () => provider?.removeListener?.("accountsChanged", onAccounts);
  }, [connect]);

  const value = useMemo(
    () => ({ address, miniPay, connecting, noProvider, connect }),
    [address, miniPay, connecting, noProvider, connect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletState {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside <WalletProvider>");
  return ctx;
}
