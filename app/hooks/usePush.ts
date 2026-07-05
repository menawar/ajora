"use client";

import { useCallback, useEffect, useState } from "react";
import { useWallet } from "./useWallet";

const PUSH_URL = process.env.NEXT_PUBLIC_PUSH_URL ?? "";

export interface PushState {
  /** Browser + env support push at all (and a push service is configured). */
  supported: boolean;
  /** An active subscription exists for this device. */
  enabled: boolean;
  busy: boolean;
  error?: string;
}

/**
 * Opt-in Web Push (#16): registers /sw.js, subscribes against the push service's
 * VAPID key, and posts the subscription with the wallet address. Draw results and
 * streak nudges arrive even with the Mini App closed.
 */
export function usePush() {
  const { address } = useWallet();
  const [state, setState] = useState<PushState>({
    supported: false,
    enabled: false,
    busy: false,
  });

  useEffect(() => {
    if (!PUSH_URL || typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    void (async () => {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState((s) => ({ ...s, supported: true, enabled: sub !== null }));
    })();
  }, []);

  const enable = useCallback(async () => {
    if (!address || !PUSH_URL) return;
    setState((s) => ({ ...s, busy: true, error: undefined }));
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        throw new Error("Notifications not allowed");
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const { key } = (await (await fetch(`${PUSH_URL}/vapid-public-key`)).json()) as {
        key: string;
      };
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key,
      });
      const res = await fetch(`${PUSH_URL}/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address, subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error(`subscribe failed (${res.status})`);
      setState((s) => ({ ...s, enabled: true, busy: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        error: err instanceof Error ? err.message : "Could not enable notifications",
      }));
    }
  }, [address]);

  const disable = useCallback(async () => {
    setState((s) => ({ ...s, busy: true, error: undefined }));
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`${PUSH_URL}/subscriptions`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setState((s) => ({ ...s, enabled: false, busy: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        error: err instanceof Error ? err.message : "Could not disable notifications",
      }));
    }
  }, []);

  return { ...state, enable, disable };
}
