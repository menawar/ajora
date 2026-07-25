export interface ApiResponse {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  tags?: string[];
}
