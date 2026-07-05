import webpush from "web-push";
import type { PushStore, Subscription } from "./store.ts";
import type { NotificationPayload } from "./jobs.ts";

export interface VapidEnv {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export function readVapidEnv(): VapidEnv {
  const publicKey = process.env.VAPID_PUBLIC_KEY ?? "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";
  const subject = process.env.VAPID_SUBJECT ?? "mailto:ops@ajora.example";
  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing — run `npm run vapid`");
  }
  return { publicKey, privateKey, subject };
}

export function configureVapid(env: VapidEnv): void {
  webpush.setVapidDetails(env.subject, env.publicKey, env.privateKey);
}

/**
 * Real Web Push delivery. 404/410 mean the browser dropped the subscription —
 * remove it so dead endpoints stop consuming the send budget.
 */
export function makeSender(store: PushStore) {
  return async (sub: Subscription, payload: NotificationPayload): Promise<boolean> => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        { TTL: 6 * 3600, urgency: "normal" },
      );
      return true;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) store.remove(sub.endpoint);
      return false;
    }
  };
}
