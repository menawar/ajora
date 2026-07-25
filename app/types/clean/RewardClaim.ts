export interface RewardClaim {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
