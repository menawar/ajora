import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { PushStore } from "./store.ts";
import { runClaimJob, runDrawJob, runStreakJob, type JobDeps } from "./jobs.ts";
import { configureVapid, makeSender, readVapidEnv } from "./webpush.ts";

/**
 * Ajora push service (#16). State lives in SQLite; ticks are idempotent, so the
 * internal 15-minute scheduler, the keeper cron, and manual /tick calls can all
 * coexist without double sends.
 */

export interface AppEnv {
  store: PushStore;
  vapidPublicKey: string;
  tickToken: string;
  jobs: JobDeps;
}

export function buildApp(env: AppEnv): Hono {
  const app = new Hono();

  // The Mini App calls from its own origin (#57). ALLOWED_ORIGINS is a comma list;
  // unset means wide open, which is only acceptable in dev — set it in production.
  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(
    "*",
    cors({
      origin: allowed.length ? allowed : "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      maxAge: 86_400,
    }),
  );

  app.get("/health", (c) =>
    c.json({ ok: true, subscribers: env.store.metrics().subscribers }),
  );

  app.get("/vapid-public-key", (c) => c.json({ key: env.vapidPublicKey }));

  app.post("/subscriptions", async (c) => {
    const body = (await c.req.json().catch(() => null)) as {
      address?: string;
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      quietStart?: number;
      quietEnd?: number;
    } | null;
    const endpoint = body?.subscription?.endpoint;
    const p256dh = body?.subscription?.keys?.p256dh;
    const auth = body?.subscription?.keys?.auth;
    const address = body?.address;
    if (!endpoint || !p256dh || !auth || !/^0x[0-9a-fA-F]{40}$/.test(address ?? "")) {
      return c.json({ error: "address + web push subscription required" }, 400);
    }
    const hour = (v: unknown, fallback: number) =>
      typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23 ? v : fallback;

    env.store.upsert({
      endpoint,
      address: address as string,
      p256dh,
      auth,
      quietStart: hour(body?.quietStart, 21),
      quietEnd: hour(body?.quietEnd, 5),
    });
    return c.json({ ok: true });
  });

  app.delete("/subscriptions", async (c) => {
    const body = (await c.req.json().catch(() => null)) as { endpoint?: string } | null;
    if (!body?.endpoint) return c.json({ error: "endpoint required" }, 400);
    env.store.remove(body.endpoint);
    return c.json({ ok: true });
  });

  app.get("/metrics", (c) => c.json(env.store.metrics()));

  const authed = (c: { req: { header: (n: string) => string | undefined } }) =>
    env.tickToken !== "" && c.req.header("authorization") === `Bearer ${env.tickToken}`;

  app.post("/tick/draw", async (c) => {
    if (!authed(c)) return c.json({ error: "unauthorized" }, 401);
    return c.json(await runDrawJob(env.jobs));
  });

  app.post("/tick/streak", async (c) => {
    if (!authed(c)) return c.json({ error: "unauthorized" }, 401);
    return c.json(await runStreakJob(env.jobs));
  });

  app.post("/tick/claim", async (c) => {
    if (!authed(c)) return c.json({ error: "unauthorized" }, 401);
    return c.json(await runClaimJob(env.jobs));
  });

  return app;
}

function main(): void {
  const vapid = readVapidEnv();
  configureVapid(vapid);

  const store = new PushStore(process.env.DB_PATH ?? "./push.db");
  const jobs: JobDeps = {
    store,
    indexerUrl: process.env.INDEXER_URL ?? "http://localhost:42069",
    send: makeSender(store),
  };
  const env: AppEnv = {
    store,
    vapidPublicKey: vapid.publicKey,
    tickToken: process.env.TICK_TOKEN ?? "",
    jobs,
  };

  // Idempotent ticks every 15 min: catches the post-midnight draw, the evening nudge
  // window, and quiet-hours deferrals without any external cron. Belt-and-braces cron
  // via POST /tick/* stays available (keeper workflow).
  const TICK_MS = 15 * 60 * 1000;
  setInterval(() => {
    runDrawJob(jobs).catch((err) => console.error("draw tick failed:", err));
    runStreakJob(jobs).catch((err) => console.error("streak tick failed:", err));
    runClaimJob(jobs).catch((err) => console.error("claim tick failed:", err));
  }, TICK_MS).unref();

  const port = Number(process.env.PORT ?? 42070);
  serve({ fetch: buildApp(env).fetch, port });
  console.log(`ajora-push listening on :${port}`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop() ?? "")) {
  main();
}
