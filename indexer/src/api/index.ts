import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono, type Context as HonoContext } from "hono";
import {
  client,
  graphql,
  alias,
  and,
  count,
  countDistinct,
  desc,
  eq,
  gte,
  notInArray,
  sql,
  sum,
} from "ponder";

const app = new Hono();

app.use("/sql/*", client({ db, schema }));

app.use("/", graphql({ db, schema }));
app.use("/graphql", graphql({ db, schema }));

const DAY = 86_400;
const currentPeriod = () => BigInt(Math.floor(Date.now() / 1000 / DAY));
const dateOf = (day: bigint) => new Date(Number(day) * DAY * 1000).toISOString().slice(0, 10);

/** JSON response with bigints rendered as strings (wei amounts stay exact). */
const json = (c: HonoContext, data: unknown) =>
  c.newResponse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
    200,
    { "Content-Type": "application/json" },
  );

const clampLimit = (c: HonoContext, fallback: number) => {
  const n = Number(c.req.query("limit") ?? fallback);
  return Number.isFinite(n) ? Math.min(Math.max(1, Math.trunc(n)), 100) : fallback;
};

/**
 * Ring-detection heuristics (AJORA_SPEC.md §13), computed from on-chain data alone.
 * Flags exclude accounts from leaderboards/reward views — they never touch funds.
 * - reciprocal-spray: A sprayed B and B sprayed A (2-cycles are the cheapest wash loop).
 * - repeat-pair: the same sender sprayed the same recipient 5+ times (drip farming).
 */
async function computeFlags(): Promise<Map<string, string[]>> {
  const back = alias(schema.sprays, "back");
  const reciprocal = await db
    .selectDistinct({ a: schema.sprays.from, b: schema.sprays.to })
    .from(schema.sprays)
    .innerJoin(back, and(eq(back.from, schema.sprays.to), eq(back.to, schema.sprays.from)));

  const repeat = await db
    .select({ a: schema.sprays.from, b: schema.sprays.to })
    .from(schema.sprays)
    .groupBy(schema.sprays.from, schema.sprays.to)
    .having(sql`count(*) >= 5`);

  const flags = new Map<string, string[]>();
  const add = (addr: string, reason: string) => {
    const list = flags.get(addr) ?? [];
    if (!list.includes(reason)) list.push(reason);
    flags.set(addr, list);
  };
  for (const { a, b } of reciprocal) {
    add(a, "reciprocal-spray");
    add(b, "reciprocal-spray");
  }
  for (const { a, b } of repeat) {
    add(a, "repeat-pair");
    add(b, "repeat-pair");
  }
  return flags;
}

/** Flagged accounts + reasons, for the sybil-adjusted metrics view. */
app.get("/flags", async (c) => {
  const flags = await computeFlags();
  return json(
    c,
    [...flags.entries()].map(([address, reasons]) => ({ address, reasons })),
  );
});

const wantsFlagged = (c: HonoContext) => c.req.query("includeFlagged") === "true";

/**
 * Top savers for one period (default: today). Feeds the "today's top savers" board.
 * Flagged accounts are excluded unless ?includeFlagged=true (raw view).
 */
app.get("/leaderboard/savers", async (c) => {
  const period = BigInt(c.req.query("period") ?? currentPeriod());
  const flagged = wantsFlagged(c) ? [] : [...(await computeFlags()).keys()];
  const where = flagged.length
    ? and(
        eq(schema.contributions.periodId, period),
        notInArray(schema.contributions.user, flagged as `0x${string}`[]),
      )
    : eq(schema.contributions.periodId, period);
  const rows = await db
    .select({
      address: schema.contributions.user,
      amount: sum(schema.contributions.amount),
      tickets: sum(schema.contributions.tickets),
    })
    .from(schema.contributions)
    .where(where)
    .groupBy(schema.contributions.user)
    .orderBy(desc(sum(schema.contributions.amount)))
    .limit(clampLimit(c, 20));
  return json(c, { period, excludedFlagged: flagged.length, rows });
});

/** All-time boards over the users table: ?by=saved (default) | won | streak. */
app.get("/leaderboard/alltime", async (c) => {
  const by = c.req.query("by") ?? "saved";
  const order =
    by === "won"
      ? desc(schema.users.totalWon)
      : by === "streak"
        ? desc(schema.users.currentStreak)
        : desc(schema.users.totalSaved);
  const flagged = wantsFlagged(c) ? [] : [...(await computeFlags()).keys()];
  const rows = await db
    .select()
    .from(schema.users)
    .where(
      flagged.length ? notInArray(schema.users.address, flagged as `0x${string}`[]) : undefined,
    )
    .orderBy(order)
    .limit(clampLimit(c, 20));
  return json(c, { by, excludedFlagged: flagged.length, rows });
});

/** Period state: totals while open, draw result + winners once resolved. */
app.get("/periods/:id", async (c) => {
  const periodId = BigInt(c.req.param("id"));

  const [totals] = await db
    .select({
      contributions: count(),
      savers: countDistinct(schema.contributions.user),
      principalIn: sum(schema.contributions.amount),
      tickets: sum(schema.contributions.tickets),
    })
    .from(schema.contributions)
    .where(eq(schema.contributions.periodId, periodId));

  const [pickRow] = await db
    .select({ picks: count() })
    .from(schema.picks)
    .where(eq(schema.picks.periodId, periodId));

  const [draw] = await db
    .select()
    .from(schema.draws)
    .where(eq(schema.draws.periodId, periodId));

  let winners: unknown[] = [];
  if (draw) {
    const rows = await db
      .select({
        address: schema.picks.user,
        weight: schema.picks.weight,
        settled: schema.wins.amount,
        claimed: schema.wins.claimed,
      })
      .from(schema.picks)
      .leftJoin(
        schema.wins,
        and(eq(schema.wins.user, schema.picks.user), eq(schema.wins.periodId, schema.picks.periodId)),
      )
      .where(
        and(eq(schema.picks.periodId, periodId), eq(schema.picks.number, draw.winningNumber)),
      );
    winners = rows.map((w) => ({
      ...w,
      claimed: w.claimed ?? false,
      // pro-rata share of the pot; exact figure appears in `settled` once claimed
      share: draw.totalWinningWeight > 0n ? (draw.pot * w.weight) / draw.totalWinningWeight : 0n,
    }));
  }

  return json(c, {
    periodId,
    totals: {
      contributions: totals?.contributions ?? 0,
      savers: totals?.savers ?? 0,
      principalIn: totals?.principalIn ?? "0",
      tickets: totals?.tickets ?? "0",
      picks: pickRow?.picks ?? 0,
    },
    draw: draw ?? null,
    winners,
  });
});

/** Profile + win history: everything a win card or wallet screen needs. */
app.get("/users/:address", async (c) => {
  const address = c.req.param("address").toLowerCase() as `0x${string}`;
  const [user] = await db.select().from(schema.users).where(eq(schema.users.address, address));
  if (!user) return c.notFound();

  const userWins = await db
    .select()
    .from(schema.wins)
    .where(eq(schema.wins.user, address))
    .orderBy(desc(schema.wins.periodId));

  return json(c, { ...user, wins: userWins });
});

/**
 * Daily rollup (AJORA_SPEC.md §12 daily_metrics): DAU, new users, tx count,
 * principal in, jara paid, d1/d7 retention, k-factor. ?days=N window, default 30.
 */
app.get("/metrics/daily", async (c) => {
  const days = Math.min(Math.max(1, Number(c.req.query("days") ?? 30) || 30), 365);
  const since = currentPeriod() - BigInt(days - 1);

  const activity = await db
    .select({ day: schema.userDays.day, dau: count() })
    .from(schema.userDays)
    .where(gte(schema.userDays.day, since))
    .groupBy(schema.userDays.day);

  const joined = await db
    .select({ day: schema.users.firstSeenPeriod, newUsers: count() })
    .from(schema.users)
    .where(gte(schema.users.firstSeenPeriod, since))
    .groupBy(schema.users.firstSeenPeriod);

  const saved = await db
    .select({
      day: schema.contributions.periodId,
      txCount: count(),
      principalIn: sum(schema.contributions.amount),
    })
    .from(schema.contributions)
    .where(gte(schema.contributions.periodId, since))
    .groupBy(schema.contributions.periodId);

  const picked = await db
    .select({ day: schema.picks.periodId, txCount: count() })
    .from(schema.picks)
    .where(gte(schema.picks.periodId, since))
    .groupBy(schema.picks.periodId);

  const sprayed = await db
    .select({ day: schema.sprays.periodId, txCount: count() })
    .from(schema.sprays)
    .where(gte(schema.sprays.periodId, since))
    .groupBy(schema.sprays.periodId);

  const paid = await db
    .select({ day: schema.wins.periodId, jaraPaid: sum(schema.wins.amount) })
    .from(schema.wins)
    .where(gte(schema.wins.periodId, since))
    .groupBy(schema.wins.periodId);

  const referred = await db
    .select({ day: schema.referrals.periodId, referrals: count() })
    .from(schema.referrals)
    .where(gte(schema.referrals.periodId, since))
    .groupBy(schema.referrals.periodId);

  // Of the users active on `day`, how many came back on day+1 / day+7.
  const later = alias(schema.userDays, "later");
  const retainedOn = (offset: number) =>
    db
      .select({ day: schema.userDays.day, retained: count() })
      .from(schema.userDays)
      .innerJoin(
        later,
        and(
          eq(later.address, schema.userDays.address),
          eq(later.day, sql`${schema.userDays.day} + ${offset}`),
        ),
      )
      .where(gte(schema.userDays.day, since))
      .groupBy(schema.userDays.day);
  const [d1, d7] = await Promise.all([retainedOn(1), retainedOn(7)]);

  const byDay = new Map<bigint, Record<string, unknown>>();
  const roll = <T extends { day: bigint }>(rows: T[], fold: (row: T) => Record<string, unknown>) => {
    for (const row of rows) {
      const entry = byDay.get(row.day) ?? {};
      byDay.set(row.day, { ...entry, ...fold(row) });
    }
  };

  roll(activity, (r) => ({ dau: r.dau }));
  roll(joined, (r) => ({ newUsers: r.newUsers }));
  roll(saved, (r) => ({ contributions: r.txCount, principalIn: r.principalIn }));
  roll(picked, (r) => ({ picks: r.txCount }));
  roll(sprayed, (r) => ({ sprays: r.txCount }));
  roll(paid, (r) => ({ jaraPaid: r.jaraPaid }));
  roll(referred, (r) => ({ referrals: r.referrals }));
  roll(d1, (r) => ({ retainedD1: r.retained }));
  roll(d7, (r) => ({ retainedD7: r.retained }));

  const today = currentPeriod();
  const out = [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([day, m]) => {
      const dau = Number(m.dau ?? 0);
      const txCount =
        Number(m.contributions ?? 0) + Number(m.picks ?? 0) + Number(m.sprays ?? 0);
      return {
        day,
        date: dateOf(day),
        dau,
        newUsers: Number(m.newUsers ?? 0),
        txCount,
        principalIn: (m.principalIn as string | undefined) ?? "0",
        jaraPaid: (m.jaraPaid as string | undefined) ?? "0",
        referrals: Number(m.referrals ?? 0),
        kFactor: dau > 0 ? Number(m.referrals ?? 0) / dau : 0,
        // null while the observation window hasn't fully elapsed
        retentionD1: dau > 0 && day + 1n < today ? Number(m.retainedD1 ?? 0) / dau : null,
        retentionD7: dau > 0 && day + 7n < today ? Number(m.retainedD7 ?? 0) / dau : null,
      };
    });

  return json(c, { days, rows: out });
});

export default app;
