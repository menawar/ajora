export class LoggerService {
  public readonly name = "LoggerService";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
