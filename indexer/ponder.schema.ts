import { onchainTable, primaryKey, index } from "ponder";

/** One row per address that ever touched the game (AJORA_SPEC.md §12). */
export const users = onchainTable(
  "users",
  (t) => ({
    address: t.hex().primaryKey(),
    firstSeenPeriod: t.bigint().notNull(),
    totalSaved: t.bigint().notNull(),
    currentBalance: t.bigint().notNull(),
    totalWon: t.bigint().notNull(),
    ticketsAllTime: t.bigint().notNull(),
    currentStreak: t.integer().notNull(),
    multiplierX10: t.integer().notNull(), // 10 = 1.0x, mirrors StreakSBT
    lastCheckInDay: t.bigint().notNull(), // 0 = never; feeds streak-at-risk nudges (#16)
    verified: t.boolean().notNull(),
  }),
  (table) => ({
    firstSeenIdx: index().on(table.firstSeenPeriod),
    lastCheckInIdx: index().on(table.lastCheckInDay),
  }),
);

export const contributions = onchainTable(
  "contributions",
  (t) => ({
    id: t.text().primaryKey(), // txHash-logIndex
    user: t.hex().notNull(),
    periodId: t.bigint().notNull(),
    amount: t.bigint().notNull(),
    token: t.hex().notNull(), // §12 parity; constant until multi-stablecoin vaults land
    tickets: t.bigint().notNull(),
    timestamp: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    periodIdx: index().on(table.periodId),
  }),
);

export const picks = onchainTable(
  "picks",
  (t) => ({
    user: t.hex().notNull(),
    periodId: t.bigint().notNull(),
    number: t.integer().notNull(),
    weight: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.user, table.periodId] }),
    periodIdx: index().on(table.periodId),
  }),
);

export const sprays = onchainTable(
  "sprays",
  (t) => ({
    id: t.text().primaryKey(),
    from: t.hex().notNull(),
    to: t.hex().notNull(),
    periodId: t.bigint().notNull(),
    value: t.bigint().notNull(),
    campaignId: t.hex().notNull(), // §12: which sponsor budget backed this spray
    timestamp: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    periodIdx: index().on(table.periodId),
  }),
);

/** Singleton mirror of SprayFaucet.activeCampaign, kept via CampaignActivated events. */
export const campaignState = onchainTable("campaign_state", (t) => ({
  id: t.text().primaryKey(), // always "active"
  campaignId: t.hex().notNull(),
}));

export const draws = onchainTable("draws", (t) => ({
  periodId: t.bigint().primaryKey(),
  winningNumber: t.integer().notNull(),
  seed: t.bigint().notNull(),
  pot: t.bigint().notNull(),
  totalWinningWeight: t.bigint().notNull(),
  resolvedAt: t.bigint().notNull(), // claim-window anchor (DrawManager.CLAIM_WINDOW)
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));

/**
 * One row per settled prize (DrawManager:PrizeClaimed). `claimed` flips when the
 * winner withdraws from the vault (PotVault:WinningsClaimed) — the two-step flow.
 */
export const wins = onchainTable(
  "wins",
  (t) => ({
    user: t.hex().notNull(),
    periodId: t.bigint().notNull(),
    amount: t.bigint().notNull(),
    claimed: t.boolean().notNull(),
    timestamp: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({ columns: [table.user, table.periodId] }),
    periodIdx: index().on(table.periodId),
  }),
);

/** Principal withdrawals and prize payouts, unified for the wallet history screen. */
export const payouts = onchainTable("payouts", (t) => ({
  id: t.text().primaryKey(),
  user: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  kind: t.text().notNull(), // "principal" | "winnings"
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));

/** SprayFaucet:ReferralBonus — a converted invite; feeds the k-factor metric. */
export const referrals = onchainTable("referrals", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  referrer: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  value: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
  txHash: t.hex().notNull(),
  blockNumber: t.bigint().notNull(),
}));

/**
 * One row per (user, day) with at least one user-initiated action.
 * Materializes activity for DAU and d1/d7 retention (period == day index).
 */
export const userDays = onchainTable(
  "user_days",
  (t) => ({
    address: t.hex().notNull(),
    day: t.bigint().notNull(),
  }),
  (table) => ({ pk: primaryKey({ columns: [table.address, table.day] }) }),
);

/** One row per crew (CrewRegistry:CrewCreated), AJORA_SPEC.md §12. */
export const crews = onchainTable("crews", (t) => ({
  id: t.bigint().primaryKey(), // crewId
  founder: t.hex().notNull(),
  code: t.hex().notNull(), // founder's bytes32 referral code
  memberCount: t.integer().notNull(),
  totalSaved: t.bigint().notNull(), // lifetime, summed from ContributionRecorded
  createdAt: t.bigint().notNull(),
}));

/** Crew membership — founder plus everyone who joined. Exactly one crew per member. */
export const crewMembers = onchainTable("crew_members", (t) => ({
  address: t.hex().primaryKey(),
  crewId: t.bigint().notNull(),
  referrer: t.hex(), // null for the founder; the inviter for joiners
  joinedAt: t.bigint().notNull(),
}));

/** Per-crew, per-day savings — powers the crew leaderboard (spec §12). */
export const crewSavingsDaily = onchainTable(
  "crew_savings_daily",
  (t) => ({
    crewId: t.bigint().notNull(),
    periodId: t.bigint().notNull(),
    amount: t.bigint().notNull(),
  }),
  (table) => ({ pk: primaryKey({ columns: [table.crewId, table.periodId] }) }),
);

/**
 * Vested referrals (CrewRegistry:ReferralVested) — invites that matured past the
 * save-day threshold. Distinct from `referrals` (SprayFaucet bonus tickets).
 */
export const referralVests = onchainTable("referral_vests", (t) => ({
  referred: t.hex().primaryKey(), // one vest per referred user
  referrer: t.hex().notNull(),
  timestamp: t.bigint().notNull(),
}));
