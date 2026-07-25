export class MiniPaySdkBridge {
  public readonly name = "MiniPaySdkBridge";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
