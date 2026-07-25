export class QuestEngine {
  public readonly name = "QuestEngine";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
  public get(key: string) { return this.store.get(key); }
  public has(key: string) { return this.store.has(key); }
  public clear() { this.store.clear(); }
}
