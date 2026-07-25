export function authHeaderGuard(headers: Record<string, string>) {
  if (!headers) return false;
  const auth = headers['authorization'] || headers['Authorization'];
  if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) return false;
  return auth.slice(7).trim().length > 0;
}
