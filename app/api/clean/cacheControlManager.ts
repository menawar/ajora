export function cacheControlManager(headers: Record<string, string>) {
  if (!headers) return false;
  const auth = headers['authorization'] || headers['Authorization'];
  return typeof auth === 'string' && auth.startsWith('Bearer ');
}
