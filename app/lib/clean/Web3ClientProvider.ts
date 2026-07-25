export class Web3ClientProvider {
  public readonly name = "Web3ClientProvider";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
