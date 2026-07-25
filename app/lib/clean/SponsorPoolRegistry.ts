/**
 * SponsorPoolRegistry core service class for state storage.
 */
export class SponsorPoolRegistry {
  public readonly name = "SponsorPoolRegistry";
  private readonly store = new Map<string, unknown>();

  public set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  public get<T = unknown>(key: string): T | undefined {
    return this.store.get(key) as T | undefined;
  }

  public has(key: string): boolean {
    return this.store.has(key);
  }

  public clear(): void {
    this.store.clear();
  }
}
