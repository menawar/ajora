import { ponder, type Context } from "ponder:registry";
import {
  users,
  contributions,
  picks,
  sprays,
  draws,
  wins,
  payouts,
  referrals,
  userDays,
  campaignState,
  crews,
  crewMembers,
  crewSavingsDaily,
  referralVests,
} from "ponder:schema";

type EventWithLog = { transaction: { hash: `0x${string}` }; log: { logIndex: number } };
const logId = (event: EventWithLog) => `${event.transaction.hash}-${event.log.logIndex}`;

/** Mirrors PotVault.currentPeriod(): one period per UTC day. */
const periodOf = (timestamp: bigint) => timestamp / 86_400n;

/** The vault's stablecoin (cUSD, single-token v3). Multi-vault configs map this per vault. */
const STABLECOIN = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;

interface UserDelta {
  saved?: bigint;
  won?: bigint;
  tickets?: bigint;
  streak?: number;
  multiplierX10?: number;
  checkInDay?: bigint;
  verified?: boolean;
}

ponder.on("PotVault:Contributed", async ({ event, context }) => {
  await context.db.insert(contributions).values({
    id: logId(event),
    user: event.args.user,
    periodId: event.args.periodId,
    amount: event.args.amount,
    token: STABLECOIN,
    tickets: event.args.ticketsMinted,
    timestamp: event.block.timestamp,
  });
  await upsertUser(context, event.args.user, event.block.timestamp, {
    saved: event.args.amount,
    tickets: event.args.ticketsMinted,
  });
  await touch(context, event.args.user, event.block.timestamp);
});

ponder.on("PotVault:TicketsCredited", async ({ event, context }) => {
  await upsertUser(context, event.args.user, event.block.timestamp, {
    tickets: event.args.tickets,
  });
});

ponder.on("PotVault:PrincipalClaimed", async ({ event, context }) => {
  await context.db.insert(payouts).values({
    id: logId(event),
    user: event.args.user,
    periodId: event.args.periodId,
    amount: event.args.amount,
    kind: "principal",
    timestamp: event.block.timestamp,
  });
  await touch(context, event.args.user, event.block.timestamp);
});

// Cash-out of already-settled winnings. totalWon was counted at PrizeClaimed.
ponder.on("PotVault:WinningsClaimed", async ({ event, context }) => {
  await context.db.insert(payouts).values({
    id: logId(event),
    user: event.args.user,
    periodId: event.args.periodId,
    amount: event.args.amount,
    kind: "winnings",
    timestamp: event.block.timestamp,
  });
  await context.db
    .update(wins, { user: event.args.user, periodId: event.args.periodId })
    .set({ claimed: true });
  await touch(context, event.args.user, event.block.timestamp);
});

ponder.on("DrawManager:NumberPicked", async ({ event, context }) => {
  await context.db
    .insert(picks)
    .values({
      user: event.args.user,
      periodId: event.args.periodId,
      number: event.args.number,
      weight: event.args.weight,
    })
    .onConflictDoUpdate({ number: event.args.number, weight: event.args.weight });
  await touch(context, event.args.user, event.block.timestamp);
});

ponder.on("DrawManager:DrawResolved", async ({ event, context }) => {
  await context.db.insert(draws).values({
    periodId: event.args.periodId,
    winningNumber: event.args.winningNumber,
    seed: event.args.seed,
    pot: event.args.pot,
    totalWinningWeight: event.args.totalWinningWeight,
    resolvedAt: event.block.timestamp,
  });
});

// Prize settled into the vault's winnings ledger — this is the "win" moment.
// Withdrawal to the wallet arrives later as PotVault:WinningsClaimed.
ponder.on("DrawManager:PrizeClaimed", async ({ event, context }) => {
  await context.db.insert(wins).values({
    user: event.args.user,
    periodId: event.args.periodId,
    amount: event.args.amount,
    claimed: false,
    timestamp: event.block.timestamp,
  });
  await upsertUser(context, event.args.user, event.block.timestamp, {
    won: event.args.amount,
  });
  await touch(context, event.args.user, event.block.timestamp);
});

// Tickets are NOT counted here: SprayFaucet credits odds through
// PotVault.creditTickets, which emits TicketsCredited in the same tx.
ponder.on("SprayFaucet:CampaignActivated", async ({ event, context }) => {
  await context.db
    .insert(campaignState)
    .values({ id: "active", campaignId: event.args.campaignId })
    .onConflictDoUpdate({ campaignId: event.args.campaignId });
});

ponder.on("SprayFaucet:Sprayed", async ({ event, context }) => {
  const active = await context.db.find(campaignState, { id: "active" });
  await context.db.insert(sprays).values({
    id: logId(event),
    from: event.args.from,
    to: event.args.to,
    periodId: event.args.periodId,
    value: event.args.value,
    campaignId: active?.campaignId ?? `0x${"0".repeat(64)}`,
    timestamp: event.block.timestamp,
  });
  await touch(context, event.args.from, event.block.timestamp);
});

// Ticket count arrives via TicketsCredited; claiming the welcome is the
// recipient's own action, so it marks them active for the day.
ponder.on("SprayFaucet:WelcomeTicket", async ({ event, context }) => {
  await touch(context, event.args.user, event.block.timestamp);
});

ponder.on("SprayFaucet:Verified", async ({ event, context }) => {
  await upsertUser(context, event.args.user, event.block.timestamp, {
    verified: event.args.verified,
  });
});

ponder.on("SprayFaucet:ReferralBonus", async ({ event, context }) => {
  await context.db.insert(referrals).values({
    id: logId(event),
    referrer: event.args.referrer,
    periodId: event.args.periodId,
    value: event.args.value,
    timestamp: event.block.timestamp,
  });
});

ponder.on("StreakSBT:CheckedIn", async ({ event, context }) => {
  await upsertUser(context, event.args.user, event.block.timestamp, {
    streak: Number(event.args.streakDays),
    multiplierX10: Number(event.args.multiplierX10),
    checkInDay: periodOf(event.block.timestamp),
  });
  await touch(context, event.args.user, event.block.timestamp);
});

// ------------------------------------------------------------------- crews (#63)

ponder.on("CrewRegistry:CrewCreated", async ({ event, context }) => {
  await context.db.insert(crews).values({
    id: event.args.crewId,
    founder: event.args.founder,
    code: event.args.code,
    memberCount: 1, // the founder
    totalSaved: 0n,
    createdAt: event.block.timestamp,
  });
  await context.db.insert(crewMembers).values({
    address: event.args.founder,
    crewId: event.args.crewId,
    referrer: null, // founder has no inviter
    joinedAt: event.block.timestamp,
  });
  await touch(context, event.args.founder, event.block.timestamp);
});

// The crew row always exists here — you cannot join a crew that was never created.
ponder.on("CrewRegistry:CrewJoined", async ({ event, context }) => {
  await context.db.insert(crewMembers).values({
    address: event.args.member,
    crewId: event.args.crewId,
    referrer: event.args.referrer,
    joinedAt: event.block.timestamp,
  });
  await context.db
    .update(crews, { id: event.args.crewId })
    .set((row) => ({ memberCount: row.memberCount + 1 }));
  await touch(context, event.args.member, event.block.timestamp);
});

// Mirror of PotVault:Contributed for crew members — the vault calls back into the
// registry, so this fires in the same tx. Feeds the crew leaderboard (spec §12).
ponder.on("CrewRegistry:ContributionRecorded", async ({ event, context }) => {
  await context.db
    .insert(crewSavingsDaily)
    .values({
      crewId: event.args.crewId,
      periodId: event.args.periodId,
      amount: event.args.amount,
    })
    .onConflictDoUpdate((row) => ({ amount: row.amount + event.args.amount }));
  await context.db
    .update(crews, { id: event.args.crewId })
    .set((row) => ({ totalSaved: row.totalSaved + event.args.amount }));
});

ponder.on("CrewRegistry:ReferralVested", async ({ event, context }) => {
  await context.db.insert(referralVests).values({
    referred: event.args.referred,
    referrer: event.args.referrer,
    timestamp: event.block.timestamp,
  });
});

/** Upsert the aggregate user row: counters accumulate, statuses overwrite. */
async function upsertUser(
  context: Context,
  address: `0x${string}`,
  timestamp: bigint,
  delta: UserDelta,
) {
  await context.db
    .insert(users)
    .values({
      address,
      firstSeenPeriod: periodOf(timestamp),
      totalSaved: delta.saved ?? 0n,
      totalWon: delta.won ?? 0n,
      ticketsAllTime: delta.tickets ?? 0n,
      currentStreak: delta.streak ?? 0,
      multiplierX10: delta.multiplierX10 ?? 10,
      lastCheckInDay: delta.checkInDay ?? 0n,
      verified: delta.verified ?? false,
    })
    .onConflictDoUpdate((row) => ({
      totalSaved: row.totalSaved + (delta.saved ?? 0n),
      totalWon: row.totalWon + (delta.won ?? 0n),
      ticketsAllTime: row.ticketsAllTime + (delta.tickets ?? 0n),
      currentStreak: delta.streak ?? row.currentStreak,
      multiplierX10: delta.multiplierX10 ?? row.multiplierX10,
      lastCheckInDay: delta.checkInDay ?? row.lastCheckInDay,
      verified: delta.verified ?? row.verified,
    }));
}

/** Record a user-initiated action for DAU/retention (one row per user per day). */
async function touch(context: Context, address: `0x${string}`, timestamp: bigint) {
  await context.db
    .insert(userDays)
    .values({ address, day: periodOf(timestamp) })
    .onConflictDoNothing();
}
