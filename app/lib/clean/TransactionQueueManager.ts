export class TransactionQueueManager {
  public readonly name = "TransactionQueueManager";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
