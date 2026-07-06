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

  // Quiet hours are chosen in local time and shipped to the service in UTC (#61).
  // The service has no per-subscription GET, so the local choice is the record.
  const [quiet, setQuiet] = useState<{ start: number; end: number }>(() => {
    if (typeof window === "undefined") return { start: 22, end: 6 };
    try {
      const saved = JSON.parse(localStorage.getItem("ajora.quietHours") ?? "");
      if (Number.isInteger(saved?.start) && Number.isInteger(saved?.end)) return saved;
    } catch {
      /* fall through to default */
    }
    return { start: 22, end: 6 }; // 10 PM – 6 AM local
  });

  const localHourToUtc = (h: number) => {
    const offMin = -new Date().getTimezoneOffset(); // e.g. +60 for WAT
    return Math.floor((((h * 60 - offMin) % 1440) + 1440) % 1440 / 60);
  };

  const register = useCallback(
    async (quietLocal: { start: number; end: number }) => {
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
        body: JSON.stringify({
          address,
          subscription: sub.toJSON(),
          quietStart: localHourToUtc(quietLocal.start),
          quietEnd: localHourToUtc(quietLocal.end),
        }),
      });
      if (!res.ok) throw new Error(`subscribe failed (${res.status})`);
    },
    [address],
  );

  const enable = useCallback(async () => {
    if (!address || !PUSH_URL) return;
    setState((s) => ({ ...s, busy: true, error: undefined }));
    try {
      if ((await Notification.requestPermission()) !== "granted") {
        throw new Error("Notifications not allowed");
      }
      await register(quiet);
      setState((s) => ({ ...s, enabled: true, busy: false }));
    } catch (err) {
      setState((s) => ({
        ...s,
        busy: false,
        error: err instanceof Error ? err.message : "Could not enable notifications",
      }));
    }
  }, [address, quiet, register]);

  /** Update the quiet window; re-registers when already subscribed (upsert by endpoint). */
  const setQuietHours = useCallback(
    async (start: number, end: number) => {
      const next = { start, end };
      setQuiet(next);
      localStorage.setItem("ajora.quietHours", JSON.stringify(next));
      if (!state.enabled) return;
      setState((s) => ({ ...s, busy: true, error: undefined }));
      try {
        await register(next);
        setState((s) => ({ ...s, busy: false }));
      } catch (err) {
        setState((s) => ({
          ...s,
          busy: false,
          error: err instanceof Error ? err.message : "Could not save quiet hours",
        }));
      }
    },
    [register, state.enabled],
  );

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

  return { ...state, enable, disable, quiet, setQuietHours };
}
