export function rateLimitMiddleware(headers: Record<string, string>) {
  if (!headers) return false;
  return 'authorization' in headers || 'Authorization' in headers;
}
