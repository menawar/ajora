export class RateLimiterGuard {
  public readonly name = "RateLimiterGuard";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
