export interface ContractConfig {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
}
