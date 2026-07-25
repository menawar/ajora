export class QuestEngine {
  public readonly name = "QuestEngine";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
