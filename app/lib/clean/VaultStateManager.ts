export class VaultStateManager {
  public readonly name = "VaultStateManager";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
