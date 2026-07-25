export function generateRandomSeed(input: string | number | bigint | null | undefined): string {
  if (input === null || input === undefined) return '';
  return String(input).trim();
}
