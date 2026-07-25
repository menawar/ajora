export interface VaultTransaction {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
