# Exam Duty — Mobile

Expo (SDK 57) app for the three **operational** roles: **Invigilator**, **RS**
(Room Superintendent) and **DCS** (Deputy Chief Superintendent).

The Controller (**CS**) has no mobile surface. A CS-only account can sign in
against the backend, but the login screen stops there and says so — CS work
happens on the web dashboard under `frontend/`.

---

## Running it

```bash
cd mobile
npm install --legacy-peer-deps   # see "npm and peer deps" below
npx expo start
```

Then scan the QR code with **Expo Go** (Android / iOS), or press `i` / `a` to
open a simulator.

`npx tsc --noEmit` is the typecheck gate — it must pass before anything lands.

### npm and peer deps

This project needs `--legacy-peer-deps`. There is an optional-peer conflict
between two `react-native-worklets` versions inside Expo's own dependency tree.
`npx expo-doctor` passes (21/21); npm's strict resolver does not.

---

## Pointing the app at a backend

**A phone cannot reach your laptop's `localhost`** — on the device, `localhost`
is the device. The API base URL is therefore required configuration, and
`src/api/client.ts` throws a named error rather than failing silently against a
host that was never set.

Resolution order:

1. **`EXPO_PUBLIC_API_URL`** — the way Expo documents for SDK 57. Put it in
   `mobile/.env` (gitignored); the CLI inlines it into the bundle at build time.
2. **`expo.extra.apiUrl` in `app.json`** — a checked-in default, if a team
   wants one.

The value must include the `/api` prefix, because that is where the backend
mounts its routes (`backend/app.js`).

### Option A — LAN IP (normal case)

Find the dev machine's LAN address:

```bash
ipconfig getifaddr en0        # macOS Wi-Fi
```

Start the backend bound to all interfaces (it already listens on `0.0.0.0`):

```bash
cd backend && PORT=5091 node server.js
```

Then:

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.1.5:5091/api
```

Phone and laptop must be on the same Wi-Fi, and the network must not have
client isolation (common on guest/hotel Wi-Fi). Verify from the phone's browser
first: `http://192.168.1.5:5091/` should return `{"status":"ok",...}`.

### Option B — ngrok (different networks, or a locked-down LAN)

```bash
ngrok http 5091
```

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://<subdomain>.ngrok-free.app/api
```

The backend's CORS allowlist already accepts `*.ngrok-free.app`. See the repo
root's `NGROK_SETUP_GUIDE.md`.

> CORS is not a factor for the native app in either case — React Native sends
> no `Origin` header, and `backend/app.js` allows requests without one. The
> allowlist only constrains browsers (including `npx expo start --web`).

**Restart the bundler after editing `.env`** — the value is inlined at bundle
time, not read at runtime.

---

## Test accounts

Seed them first:

```bash
cd backend && node scripts/seed-users.js
```

See `CREDENTIALS.md` at the repo root. Two notes for mobile:

- `admin@examduty.com` is **CS-only** and is intentionally rejected at login.
- The **multi-role** path (`requiresRoleSelection` → `tempToken` →
  `POST /auth/select-role`) needs an account holding more than one role.
  `CREDENTIALS.md` describes `invigilator@examduty.com` as `["rs",
  "invigilator"]`, but a database seeded before the designation→roles rule
  landed may hold only `["invigilator"]` — check before assuming. To mint one,
  register a user whose designation is `Assistant Professor` or
  `Associate Professor`; `backend/shared/utils/roleResolver.js` maps both to
  `["rs", "invigilator"]`.

---

## Push notifications and Expo Go

**Remote (push) notifications do not work in Expo Go on Android** — the
capability was removed from Expo Go in SDK 53 and that still holds in SDK 57.
The relevant docs line:

> Push notifications (remote notifications) functionality provided by
> `expo-notifications` is unavailable in Expo Go on Android from SDK 53. A
> development build is required to use push notifications.

What this means in practice:

- **Local/scheduled notifications** still work in Expo Go on both platforms.
- Anything that requires an **Expo push token** — i.e. the backend pushing a
  duty assignment or reminder to a device — requires a **development build**
  (`npx expo run:android` / `eas build --profile development`), not Expo Go.

Plan the notifications work accordingly: build the in-app inbox
(`GET /api/notifications`, the Alerts tab) against Expo Go, and treat remote
push as a development-build feature.

---

## Layout

### Routes (`app/`)

Route paths are the contract every screen agent builds against.

| File | Route | What it is |
| --- | --- | --- |
| `app/_layout.tsx` | — | Providers + the auth guard that picks `(auth)` vs `(app)` |
| `app/index.tsx` | `/` | Forwarder to login / select-role / dashboard |
| `app/(auth)/_layout.tsx` | — | Headerless stack |
| `app/(auth)/login.tsx` | `/login` | Email + password → `POST /auth/login` |
| `app/(auth)/select-role.tsx` | `/select-role` | Multi-role picker → `POST /auth/select-role` |
| `app/(app)/_layout.tsx` | — | Bottom tab bar |
| `app/(app)/dashboard.tsx` | `/dashboard` | **placeholder** |
| `app/(app)/exams.tsx` | `/exams` | **placeholder** |
| `app/(app)/select-duty.tsx` | `/select-duty` | **placeholder** |
| `app/(app)/upcoming-duties.tsx` | `/upcoming-duties` | **placeholder** |
| `app/(app)/change-requests.tsx` | `/change-requests` | **placeholder** |
| `app/(app)/notifications.tsx` | `/notifications` | **placeholder** |

The first five tabs are the same five the web sidebar shows for these roles
(`frontend/src/modules/shared/role-config/roleConfig.ts` → `navItems`); the
sixth, Alerts, is the mobile notification inbox.

All three roles share one tab set — they differ only in which `RoomDutyFlags`
slot they own, which is what `src/shared/role-config.ts` carries. There is no
per-role route prefix on mobile, unlike the web's `/invigilator`, `/rs`, `/dcs`.

Tab icons are text glyphs because no icon package is installed. Swap in
`@expo/vector-icons` when a screen agent wants one.

### Source (`src/`)

| File | What it is |
| --- | --- |
| `src/api/client.ts` | axios instance; base-URL resolution + token/401 interceptors |
| `src/api/auth.ts` | `/auth/login`, `/auth/select-role`, `/auth/me` |
| `src/shared/store/auth.store.ts` | zustand auth store, tokens in `expo-secure-store` |
| `src/shared/role-config.ts` | the three operational roles and their `flagKey` |
| `src/shared/types.ts` | shared shapes mirrored from the web |
| `src/shared/providers.tsx` | TanStack Query + SafeAreaProvider |
| `src/shared/hooks/useAuthSession.ts` | cold-start restore + the routing guard |
| `src/shared/hooks/useAuth.ts` | login / select-role mutations |
| `src/shared/ui/` | placeholder + sign-out helpers |

`@/*` resolves to `src/*` (tsconfig `paths`; Metro honours it via Expo's
`tsconfigPaths`, on by default).

---

## Things worth knowing before writing a screen

**RS and DCS work on GROUPS of rooms; Invigilators work on SINGLE rooms.**
Every screen a group role sees must be group-shaped, never per-room. This is
the single most important domain rule.

- **DCS** groups are persisted server-side (`DCSGroup`).
- **RS** groups are *derived client-side*: available slots partitioned by
  `(examGroup | schedule | date | start | end | building)`, sorted by room
  number, chunked into 5s. The group id is
  `` `${scheduleId}:${buildingId}:${chunkIndex}` `` and **that exact format must
  be identical on every RS surface** — the backend stores it verbatim on RS
  change requests. Port the algorithm from
  `frontend/src/modules/rs/select-duty/utils/rsDutyGroupingUtils.ts`.

**Auth is multi-role.** `POST /auth/login` returns
`{ user, token, tempToken, requiresRoleSelection }`. A user with more than one
role gets `token: null` and a `tempToken` that only works on
`POST /auth/select-role`, which exchanges it for a real token carrying an
`activeRole` claim. `src/api/client.ts` sends `token` when present and falls
back to `tempToken`.

**Only tokens are persisted, not the user.** On cold start
`useAuthSession` restores the token from SecureStore, then refetches the
profile from `/auth/me`. The splash stays up for both steps, so an
already-authenticated user never sees the login screen flash.

**Mirrored files.** There is no monorepo tooling in this repo — shared logic is
hand-mirrored across packages with explicit "keep in sync" comments (see
`backend/shared/utils/roleResolver.js` and its frontend twin).
`src/shared/types.ts`, `src/shared/role-config.ts`, `src/api/client.ts` and
`src/shared/store/auth.store.ts` all follow that convention and name their web
counterpart in a header comment. Update both sides together.
