/**
 * Headless test config. There is no simulator, emulator or device on the
 * machines this repo is developed on, so the suite deliberately covers pure
 * logic — grouping, filtering, stores, interceptors — and not rendered output.
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: "jest-expo",

  // Jest's default order is ["js", ..., "ts", "tsx", ...] — a stray compiled
  // `foo.js` sitting next to `foo.ts` would win resolution and be tested in
  // place of the source. Two such artifacts were committed into src/ once
  // already, so ts/tsx go first and the source always wins.
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Mirrors the "@/*" -> "./src/*" mapping in tsconfig.json. Without it every
  // import in the app resolves under tsc and fails under Jest.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Pinned copy of the array jest-expo ships (see its jest-preset.js): React
  // Native and the Expo packages publish untranspiled ESM/Flow and must be run
  // through babel-jest, while reanimated's babel plugin and @react-native's
  // babel preset must NOT be transformed — they are part of the transformer.
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation))",
    "/node_modules/react-native-reanimated/plugin/",
    "/node_modules/@react-native/babel-preset/",
  ],

  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Call history only, not implementations — the SecureStore fake in
  // jest.setup.ts keeps behaving like a keychain, but each test starts with an
  // empty `mock.calls` so assertions on it mean what they say.
  clearMocks: true,

  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts?(x)"],

  // Fixtures are data, not suites; counting them as uncovered source would
  // make the coverage number meaningless.
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/__tests__/**",
    "!src/test/**",
  ],
};
