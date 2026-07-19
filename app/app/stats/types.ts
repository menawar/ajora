export interface DailyRow {
  periodId: number;
  date: string;
  txCount: number;
  activeUsers: number;
  newUsers: number;
  contributions: number;
  principalIn: string;
  prizesPaid: string;
  sprays: number;
  welcomes: number;
  picks: number;
  checkIns: number;
  resolved: { winningNumber: number; pot: string } | null;
}
