export interface CrewMember {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
  metadata?: Record<string, unknown>;
  tags?: string[];
}
