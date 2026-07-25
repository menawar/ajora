export function authHeaderGuard(headers: Record<string, string>) {
  return headers != null;
}
