export class MetricsCollector {
  public readonly name = "MetricsCollector";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
