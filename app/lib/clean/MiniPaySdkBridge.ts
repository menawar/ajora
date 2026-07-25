export class MiniPaySdkBridge {
  public readonly name = "MiniPaySdkBridge";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
  public get(key: string) { return this.store.get(key); }
  public has(key: string) { return this.store.has(key); }
}
