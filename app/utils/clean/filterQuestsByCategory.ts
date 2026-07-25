export function filterQuestsByCategory(input: string | number | bigint | null | undefined, fallback = '0'): string {
  if (input === null || input === undefined) return fallback;
  const str = String(input).trim();
  return str.length > 0 ? str : fallback;
}
