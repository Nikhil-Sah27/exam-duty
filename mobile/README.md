# Exam Duty — Mobile

Expo (SDK 57) app for the three **operational** roles: **Invigilator**, **RS**
(Room Superintendent) and **DCS** (Deputy Chief Superintendent). Every screen
the web sidebar offers those roles exists here, plus an Alerts inbox the web
shows as a dropdown.

The Controller (**CS**) has no mobile surface. A CS-only account can sign in
against the backend, but `useLogin` stops there and says so
(`src/shared/hooks/useAuth.ts:46`) — CS work happens on the web dashboard under
`frontend/`.

Stack: expo-router (file-based routes), TanStack Query for server cache,
Zustand for auth state, axios, `expo-secure-store` for tokens,
`expo-notifications` for push.

---

## Running it

```bash
cd mobile
npm install --legacy-peer-deps   # see "npm and peer deps" below
npx expo start
```

Then scan the QR code with **Expo Go** (Android / iOS), or press `i` / `a` to
open a simulator. `npm start`, `npm run android`, `npm run ios` and `npm run web`
are thin wrappers over the same CLI (`package.json`).

Gates, both run from `mobile/`:

```bash
npx tsc --noEmit        # must exit 0 — this is the hard gate
npx expo-doctor         # config/dependency sanity after touching app.json or package.json
```

### npm and peer deps

This project needs `--legacy-peer-deps`. There is an optional-peer conflict
between two `react-native-worklets` versions inside Expo's own dependency tree.
`npx expo-doctor` passes; npm's strict resolver does not.

---

## Pointing the app at a backend

**A phone cannot reach your laptop's `localhost`** — on the device, `localhost`
*is* the device. The API base URL is therefore required configuration, and
`src/api/client.ts` throws a named error rather than failing silently against a
host that was never set.

Resolution order (`src/api/client.ts:24-45`):

1. **`EXPO_PUBLIC_API_URL`** — the way Expo documents for SDK 57. Put it in
   `mobile/.env` (gitignored; copy `.env.example`); the CLI inlines it into the
   bundle at build time.
2. **`expo.extra.apiUrl` in `app.json`** — a checked-in default, if a team wants
   one. Currently `""`, i.e. unset.

The value must include the `/api` prefix, because that is where the backend
mounts its routes (`backend/app.js:38-55`).

### Option A — LAN IP (normal case)

Find the dev machine's LAN address:

```bash
ipconfig getifaddr en0        # macOS Wi-Fi — this machine answers 192.168.0.2
```

Start the backend. `server.js` calls `app.listen(PORT)` with no host argument,
so Node binds every interface — nothing extra to configure:

```bash
cd backend && npm run dev              # or: PORT=5001 node server.js
```

Then:

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.0.2:5001/api
```

Phone and laptop must be on the same Wi-Fi, and the network must not have
client isolation (common on guest/hotel Wi-Fi). Verify from the phone's browser
first: `http://192.168.0.2:5001/` should return `{"status":"ok",...}`
(`backend/app.js:33`).

### Option B — ngrok (different networks, or a locked-down LAN)

ngrok is installed on this machine.

```bash
ngrok http 5001
```

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://<subdomain>.ngrok-free.app/api
```

The backend's CORS allowlist already accepts `*.ngrok-free.app`
(`backend/app.js:19`). See the repo root's `NGROK_SETUP_GUIDE.md` for the shape
of the problem, though its steps predate the Vite frontend.

> CORS is not a factor for the native app in either case — React Native sends
> no `Origin` header, and `backend/app.js:19` allows requests without one. The
> allowlist only constrains browsers (including `npx expo start --web`).

**Restart the bundler after editing `.env`** — the value is inlined at bundle
time, not read at runtime.

---

## Test accounts

Seed them first:

```bash
cd backend && node scripts/seed-users.js
```

Full table in `CREDENTIALS.md` at the repo root. Two notes for mobile:

- `admin@examduty.com` is **CS-only** and is intentionally rejected at login.
- `invigilator@examduty.com` / `Invig123` is the **multi-role** account
  (`roles: ["rs", "invigilator"]`, `backend/scripts/seed-users.js:49-52`), so it
  is the one that exercises the `requiresRoleSelection` → `tempToken` →
  `POST /auth/select-role` exchange and the `/select-role` screen. Any user whose
  designation is `Assistant Professor` or `Associate Professor` gets the same
  pair (`backend/shared/utils/roleResolver.js`).

A remembered role short-circuits that screen on later logins: `useLogin`
auto-selects it if it is still in `user.roles`
(`src/shared/hooks/useAuth.ts:62-77`), and it is stored per user in SecureStore.

---

## Push notifications and Expo Go

**Remote (push) notifications do not work in Expo Go.** Expo removed the
capability from Expo Go on Android in SDK 53 and that still holds in SDK 57;
this app declines it on **both** platforms, because there is nothing to
attribute a token to either way (see `no-project-id` below). The docs line,
quoted in `src/push/registration.ts:14-18`:

> Push notifications (remote notifications) functionality provided by
> `expo-notifications` is unavailable in Expo Go on Android from SDK 53. A
> development build is required to use push notifications. Local notifications
> (in-app notifications) remain available in Expo Go.

`registerDevice` is written to fail soft rather than throw, and reports which of
six reasons applies (`src/push/registration.ts:63-97`). Two of them are
environmental and will always fire in the current setup:

- `expo-go` — running under Expo Go at all.
- `no-project-id` — `app.json` has no `extra.eas.projectId`, because `eas init`
  has never been run, and `getExpoPushTokenAsync` needs a project to attribute
  the token to.

So in practice:

- **The in-app inbox works everywhere.** The Alerts tab reads
  `GET /api/notifications` and is unaffected by any of this.
- **Anything requiring an Expo push token needs a development build** —
  `eas init`, then `npx expo run:android` or `eas build --profile development`.

No screen is blocked by push being unavailable; the Alerts tab surfaces the
reason instead (`src/push/hooks.ts:115-144`).

---

## Layout

### Routes (`app/`)

| File | Route | What it is |
| --- | --- | --- |
| `app/_layout.tsx` | — | Providers, status bar, splash hold, and the `Stack.Protected` auth guard picking `(auth)` vs `(app)` |
| `app/index.tsx` | `/` | Pure forwarder → `/dashboard`, `/select-role` or `/login` |
| `app/(auth)/_layout.tsx` | — | Headerless stack |
| `app/(auth)/login.tsx` | `/login` | Email + password → `POST /auth/login`; CS-only accounts are refused here |
| `app/(auth)/select-role.tsx` | `/select-role` | Multi-role picker → `POST /auth/select-role`, with a "remember this role" switch |
| `app/(app)/_layout.tsx` | — | Bottom tab bar (`expo-router/js-tabs`) |
| `app/(app)/dashboard.tsx` | `/dashboard` | Hero + stats + upcoming/completed sections; also hosts the push runtime |
| `app/(app)/exams.tsx` | `/exams` | Read-only exam browser, list ↔ detail in one route |
| `app/(app)/select-duty.tsx` | `/select-duty` | Dispatches to the Invigilator / RS / DCS picker |
| `app/(app)/upcoming-duties.tsx` | `/upcoming-duties` | Dispatches to the Invigilator / RS / DCS duty list |
| `app/(app)/change-requests.tsx` | `/change-requests` | Dispatches to the Invigilator / RS / DCS request panel |
| `app/(app)/notifications.tsx` | `/notifications` | Alerts inbox: list, mark-all-read, clear-all, channel preferences |

All six tabs are implemented. The first five mirror the web sidebar for these
roles (`frontend/src/modules/shared/role-config/roleConfig.ts` → `navItems`);
the sixth, Alerts, is the mobile form of the web's notification dropdown.

All three roles share **one** tab set. There is no per-role route prefix on
mobile, unlike the web's `/invigilator`, `/rs`, `/dcs` — the three routes that
differ by role (`select-duty`, `upcoming-duties`, `change-requests`) each pick a
component from `getRoleConfig(activeRole)?.roleKey` and fall back to
`RoleUnavailable`.

Tab icons are text glyphs because no icon package is installed. Swap in
`@expo/vector-icons` if a screen wants real ones.

### Source (`src/`)

80 files. `@/*` resolves to `src/*` (tsconfig `paths`; Metro honours it via
Expo's `tsconfigPaths`, on by default).

| Path | What it is |
| --- | --- |
| `src/api/client.ts` | axios instance; base-URL resolution + token/401 interceptors |
| `src/api/auth.ts` | `/auth/login`, `/auth/select-role`, `/auth/me` |
| `src/features/dashboard/` | One dashboard for all three roles: hero, stat tiles, duty sections, and the normalizers that turn duties or DCS groups into one card shape |
| `src/features/exams/` | Exam list + detail plus the status/format helpers; the exam read model itself lives in `src/features/duties/` |
| `src/features/duties/` | The largest feature (28 files): Select Duty and Upcoming Duties for all three roles — `api.ts`, `hooks/` (data + claim orchestration), `screens/` (six role screens + `RoleUnavailable`), `utils/` (conflicts, slots, lifecycle, RS grouping, formatting) — the exam read model and the RS grouping every other feature imports |
| `src/features/change-requests/` | Swap / move / drop panels per role and the request sheet; RS group identity comes from `src/features/duties/utils/rsGrouping.ts` |
| `src/features/notifications/` | Inbox rows, unread count, mark/delete mutations, and the email / WhatsApp / push channel switches |
| `src/push/` | `registration.ts` (token acquisition, Android channel, permission flow), `hooks.ts` (`usePushRuntime` on the dashboard, `usePushDevice` on Alerts), `routing.ts` (payload `screen` → route), `api.ts` (`/push/tokens` register + deregister) |
| `src/shared/store/auth.store.ts` | zustand auth store; tokens and preferred role in `expo-secure-store` |
| `src/shared/hooks/useAuthSession.ts` | Cold-start restore (hydrate → `/auth/me`) and the guard's three booleans |
| `src/shared/hooks/useAuth.ts` | login / select-role mutations, CS rejection, remembered-role auto-select |
| `src/shared/role-config.ts` | The three operational roles, their labels, `flagKey`, and `worksOnGroups` |
| `src/shared/types.ts` | Shared shapes mirrored from the web |
| `src/shared/query-client.ts` | The single module-scope `QueryClient` (sign-out clears it from outside React) |
| `src/shared/providers.tsx` | TanStack Query + SafeAreaProvider |
| `src/shared/ui/` | `SignOutButton` (deregisters push before clearing auth) |

---

## Things worth knowing before writing a screen

**RS and DCS work on GROUPS of rooms; Invigilators work on SINGLE rooms.**
Every screen a group role sees must be group-shaped, never per-room. This is the
single most important domain rule, and it is why `select-duty`,
`upcoming-duties` and `change-requests` are three components each rather than
one page with a flag — the endpoints differ too (`/duties/self-assign` for a
room, `/duties/self-assign-group` for an RS chunk, `/dcs/groups/:id/claim` for a
persisted DCS group).

- **DCS** groups are persisted server-side (`DCSGroup`).
- **RS** groups are *derived client-side*: available slots partitioned by
  `(examGroup | schedule | date | start | end | building)`, sorted by room
  number, chunked into 5s. The group id is
  `` `${scheduleId}:${buildingId}:${chunkIndex}` `` and **that exact format must
  be identical on every RS surface** — the backend stores it verbatim as
  `rsSourceKey` / `rsTargetKey` on RS change requests, and a unique index on it
  is what enforces one pending swap per group. One file implements it:
  `src/features/duties/utils/rsGrouping.ts`, holding the chunk size, the room
  comparator, both partition keys and both folds (available slots → groups, and
  the RS's own duties → the groups they were claimed as). It is a port of
  `frontend/src/modules/rs/select-duty/utils/rsDutyGroupingUtils.ts` plus
  `.../rs/upcoming-duties/utils/rsUpcomingGrouping.ts`. The duty fold drops the
  teacher's non-RS duties, because a multi-role teacher's stray invigilator room
  in the same schedule + building would shift every later `chunkIndex`.

**Room identity is building-aware.** Compare `examRoom.room._id`, never the
room-number string — "004" in Academic Block is not "004" in Lab Block.

**Approve and reject do not exist on mobile.** Both routes are
`requireRole("cs")`, and the Controller has no app.

**Auth is multi-role.** `POST /auth/login` returns
`{ user, token, tempToken, requiresRoleSelection }`. A user with more than one
role gets `token: null` and a `tempToken` that only works on
`POST /auth/select-role`, which exchanges it for a real token carrying an
`activeRole` claim. `src/api/client.ts` sends `token` when present and falls
back to `tempToken`.

**Only tokens are persisted, not the user.** On cold start `useAuthSession`
restores the token from SecureStore, then refetches the profile from
`/auth/me`. The splash stays up for both steps, so an already-authenticated user
never sees the login screen flash.

**Mirrored files.** There is no monorepo tooling in this repo — shared logic is
hand-mirrored across packages with explicit "keep in sync" comments (see
`backend/shared/utils/roleResolver.js` and its frontend twin).
`src/shared/types.ts`, `src/shared/role-config.ts`, `src/shared/query-client.ts`,
`src/api/client.ts`, `src/shared/store/auth.store.ts` and every RS-grouping and
conflict util follow that convention and name their web counterpart in a header
comment. Update both sides together.
