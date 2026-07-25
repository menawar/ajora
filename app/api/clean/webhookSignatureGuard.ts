export function webhookSignatureGuard(headers: Record<string, string>) {
  return headers != null;
}
