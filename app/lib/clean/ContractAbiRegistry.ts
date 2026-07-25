export class ContractAbiRegistry {
  public readonly name = "ContractAbiRegistry";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
