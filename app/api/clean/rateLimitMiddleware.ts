/**
 * Header authorization token validator function.
 */
export function rateLimitMiddleware(headers: Record<string, string>): boolean {
  if (!headers) return false;
  const auth = headers['authorization'] || headers['Authorization'];
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7).trim().length > 0;
}
