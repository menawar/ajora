export class BiometricAuthSession {
  public readonly name = "BiometricAuthSession";
  private store = new Map<string, unknown>();
  public set(key: string, value: unknown) { this.store.set(key, value); }
}
