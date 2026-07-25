export class CacheStorageEngine {
  public readonly name = "CacheStorageEngine";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
