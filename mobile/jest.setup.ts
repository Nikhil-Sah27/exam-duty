/**
 * Global test setup.
 *
 * expo-secure-store is a native module: under Jest its real implementation has
 * no keychain to talk to. It is replaced here — rather than per suite — because
 * `src/shared/store/auth.store.ts` imports it at module scope, so *any* suite
 * that transitively touches the auth store (the API client does) would
 * otherwise pull the native binding in.
 *
 * The replacement is a real in-memory keychain, not a set of no-ops. The auth
 * store's writes are fire-and-forget, so asserting that `setItemAsync` was
 * *called* proves very little; reading the value back through `getItemAsync`
 * proves the token actually landed and — for logout — that it is gone.
 */
const mockKeychain = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn((key: string, value: string): Promise<void> => {
    mockKeychain.set(key, value);
    return Promise.resolve();
  }),
  getItemAsync: jest.fn(
    (key: string): Promise<string | null> =>
      Promise.resolve(mockKeychain.get(key) ?? null)
  ),
  deleteItemAsync: jest.fn((key: string): Promise<void> => {
    mockKeychain.delete(key);
    return Promise.resolve();
  }),
}));

beforeEach(() => {
  mockKeychain.clear();
});
