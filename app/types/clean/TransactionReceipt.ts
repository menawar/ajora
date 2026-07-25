export interface TransactionReceipt {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
}
