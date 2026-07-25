export interface YieldProjection {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
}
