/**
 * Web3ClientProvider core service class for state storage.
 */
export class Web3ClientProvider {
  public readonly name = "Web3ClientProvider";
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
