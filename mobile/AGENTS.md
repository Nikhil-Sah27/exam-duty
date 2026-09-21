# Working in `mobile/`

`mobile/CLAUDE.md` is just `@AGENTS.md`, so this file is what an agent reads
when working in this directory. Read `mobile/README.md` for the route table,
the source map, and how to point the app at a backend. Read the repo root's
`CLAUDE.md` for the domain invariants that span backend, frontend and mobile.

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before
writing any Expo code. SDK 57 is new and model priors about `expo-router`,
`expo-notifications` and `SplashScreen` are wrong more often than they are
right. Two already-bitten examples, both fixed in this tree:

- Tabs come from `expo-router/js-tabs`, not `expo-router`.
- `setNotificationHandler` uses `shouldShowBanner` / `shouldShowList`;
  `shouldShowAlert` is deprecated in SDK 57.

## Gates

```bash
cd mobile
npm install --legacy-peer-deps   # required — optional-peer conflict inside Expo's own tree
npx tsc --noEmit                 # gate 1 — must exit 0 before anything lands
npm test                         # gate 2 — jest-expo unit suite, must be green
npx expo-doctor                  # run after touching app.json or package.json
npx expo start
```

`--legacy-peer-deps` is not optional: two `react-native-worklets` versions
inside Expo's dependency tree fail npm's strict resolver. `expo-doctor` passes
regardless.

`npm test` is the second gate, not an optional extra — currently 9 suites / 150
tests, all green. The `TZ=Asia/Kolkata` in the script is load-bearing: 6 tests
across 3 suites fail under `TZ=UTC`, so run `npm test`, never a bare `npx jest`.
The suite is headless by design (see the header in `jest.config.js`) — pure
logic only, no rendered output — so a change to grouping, filtering, the auth
store or the axios interceptor is expected to come with a test.

## Rules that bite here

- No `any`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`.
- Never commit compiled `.js` into `src/`. `expo/tsconfig.base` sets `noEmit`,
  so only an explicit emit can reintroduce one — if you see a `.js` next to a
  `.tsx`, it is an artifact, not source.
- Comments explain WHY, never WHAT. The existing headers in `src/` set the bar:
  each one names the web file it mirrors and the reason it diverges.
- Smallest correct change.

## Domain rules, mobile edition

- **RS and DCS work on GROUPS of rooms; Invigilators work on SINGLE rooms.** A
  change that makes a group role render a per-room card is a bug, not a
  simplification. `RoleConfig.worksOnGroups` in `src/shared/role-config.ts`
  carries this.
- **RS groups are derived, never persisted**: slots partitioned by
  `(examGroup | schedule | date | start | end | building)`, sorted by room
  number, chunked into 5s, keyed
  `` `${scheduleId}:${buildingId}:${chunkIndex}` ``. The backend stores that
  string verbatim as `rsSourceKey` / `rsTargetKey`, so it must be byte-identical
  on every surface and on both clients. Exactly one file implements it —
  `src/features/duties/utils/rsGrouping.ts` — holding the chunk size, the room
  comparator, both partition keys and both folds (slots → groups and the RS's
  own duties → groups). Select Duty, Upcoming Duties, Change Requests and the
  Dashboard all import it. Do not re-implement any part of it: the fold also
  drops the teacher's non-RS duties, because a teacher can hold several roles
  and one stray invigilator room in the same schedule + building shifts every
  later `chunkIndex`.
- **Room identity is building-aware.** Compare `examRoom.room._id`, never the
  room-number string.
- **CS has no mobile surface.** Approve/reject are `requireRole("cs")`; a
  CS-only account is refused at login on purpose.

## Hand-mirrored files

There is no monorepo tooling in this repo. `src/shared/types.ts`,
`src/shared/role-config.ts`, `src/api/client.ts`,
`src/shared/store/auth.store.ts`, `src/shared/query-client.ts` and the duty
utils are hand-copied from `frontend/` and each names its counterpart in a
header comment — the same convention as `backend/shared/utils/roleResolver.js`
and its frontend twin. Change both sides together, or the two clients drift.
