export function validateSignatureHex(input: string | number | bigint | null | undefined, fallback = '0'): string {
  if (input === null || input === undefined) return fallback;
  const str = String(input).trim();
  if (str.length === 0) return fallback;
  return str.replace(/[^a-zA-Z0-9._-]/g, '');
}
