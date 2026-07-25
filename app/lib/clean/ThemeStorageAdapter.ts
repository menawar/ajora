export class ThemeStorageAdapter {
  public readonly name = "ThemeStorageAdapter";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
