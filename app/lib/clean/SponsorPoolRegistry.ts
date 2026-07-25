export class SponsorPoolRegistry {
  public readonly name = "SponsorPoolRegistry";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
