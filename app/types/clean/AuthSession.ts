export interface AuthSession {
  id: string;
  createdAt: string;
  status: 'active' | 'inactive';
}
