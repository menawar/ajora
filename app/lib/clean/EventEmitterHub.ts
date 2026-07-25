export class EventEmitterHub {
  public readonly name = "EventEmitterHub";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
