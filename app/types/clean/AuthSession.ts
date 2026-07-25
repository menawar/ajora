/**
 * Domain entity type specification for AuthSession.
 */
export interface AuthSession {
  /** Primary identifier */
  id: string;
  /** Creation ISO timestamp */
  createdAt: string;
  /** Entity status flag */
  status: 'active' | 'inactive';
  /** Optional metadata map */
  metadata?: Record<string, unknown>;
  /** Tag list */
  tags?: string[];
}
