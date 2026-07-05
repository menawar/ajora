import { onchainTable, primaryKey } from "ponder";

/** One row per address that ever touched the game (AJORA_SPEC.md §12). */
export const users = onchainTable("users", (t) => ({
  address: t.hex().primaryKey(),
  firstSeenPeriod: t.bigint().notNull(),
  totalSaved: t.bigint().notNull(),
  totalWon: t.bigint().notNull(),
  ticketsAllTime: t.bigint().notNull(),
  currentStreak: t.integer().notNull(),
  multiplierX10: t.integer().notNull(), // 10 = 1.0x, mirrors StreakSBT
  lastCheckInDay: t.bigint().notNull(), // 0 = never; feeds streak-at-risk nudges (#16)
  verified: t.boolean().notNull(),
}));

export const contributions = onchainTable("contributions", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  user: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  tickets: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const picks = onchainTable(
  "picks",
  (t) => ({
    user: t.hex().notNull(),
    periodId: t.bigint().notNull(),
    number: t.integer().notNull(),
    weight: t.bigint().notNull(),
  }),
  (table) => ({ pk: primaryKey({ columns: [table.user, table.periodId] }) }),
);

export const sprays = onchainTable("sprays", (t) => ({
  id: t.text().primaryKey(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  value: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
}));

export const draws = onchainTable("draws", (t) => ({
  periodId: t.bigint().primaryKey(),
  winningNumber: t.integer().notNull(),
  seed: t.bigint().notNull(),
  pot: t.bigint().notNull(),
  totalWinningWeight: t.bigint().notNull(),
  resolvedAt: t.bigint().notNull(), // claim-window anchor (DrawManager.CLAIM_WINDOW)
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
  }),
  (table) => ({ pk: primaryKey({ columns: [table.user, table.periodId] }) }),
);

/** Principal withdrawals and prize payouts, unified for the wallet history screen. */
export const payouts = onchainTable("payouts", (t) => ({
  id: t.text().primaryKey(),
  user: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  amount: t.bigint().notNull(),
  kind: t.text().notNull(), // "principal" | "winnings"
  timestamp: t.bigint().notNull(),
}));

/** SprayFaucet:ReferralBonus — a converted invite; feeds the k-factor metric. */
export const referrals = onchainTable("referrals", (t) => ({
  id: t.text().primaryKey(), // txHash-logIndex
  referrer: t.hex().notNull(),
  periodId: t.bigint().notNull(),
  value: t.bigint().notNull(),
  timestamp: t.bigint().notNull(),
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
