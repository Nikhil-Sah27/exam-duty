# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Read First

`README.md` is long and current for domain concepts (roles, DCS group sizing formula, seat sharing, full API reference, model list). `APP_FLOW.md` walks the same ground per-role, screen by screen. Do not duplicate those here — this file covers commands, invariants, and the places where the code has drifted from the docs.

## Commands

```bash
npm run install:all                # install backend + frontend deps (tests/ installs separately)
npm run dev                        # both servers via concurrently (backend :5001, frontend :5173)
npm run dev:backend                # nodemon backend only
npm run dev:frontend               # vite frontend only
npm run build                      # frontend: tsc -b && vite build
```

Backend needs `backend/.env` (`PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`) and a running MongoDB; `backend/.env.example` lists every var, including the optional email / reminder / WhatsApp blocks. The backend defaults to port **5001** — `:5000` is held by ControlCenter (AirPlay Receiver) on macOS.

The frontend needs no env for the default setup, but it does read one: `frontend/vite.config.ts` calls `loadEnv(mode, __dirname, "")` and proxies `/api` → `DEV_API_PROXY_TARGET` (default `http://localhost:5001`) in both `dev` and `preview`. `frontend/.env.example` documents that and `VITE_API_URL` — see "Where the docs are stale" for the difference.

### Tests

API integration tests hit a **live server** — they are not unit tests. MongoDB and the backend must be running first.

```bash
cd tests && npm install
npm test                                   # all 10 suites via runner.js, sequential, shared auth token
npm run test:duties                        # single suite (see tests/package.json for the full list)
node 07-duties.test.js                     # same thing directly
API_URL=https://x.ngrok-free.app/api npm test   # target a remote server
```

The runner threads the token from the Auth suite into later suites, so a single suite run re-authenticates on its own. Admin creds live in `tests/config.js`.

### Type checking and lint

- `npx tsc -b` from `frontend/` — **currently clean: zero errors**. The `UserRole` nullability errors left over from the multi-role migration are fixed. Any error it reports is one you introduced. It is an incremental build, so use `npx tsc -b --force` when you want to be sure the cached `tsconfig.tsbuildinfo` isn't hiding anything.
- `npm run lint` in `frontend/` **works** — `frontend/eslint.config.js` (flat config, eslint 9) is committed. Baseline is **27 problems: 14 errors, 13 warnings** — `react-hooks/set-state-in-effect` ×11, `react-refresh/only-export-components` ×3 (errors); `react-hooks/exhaustive-deps` ×12, `react-hooks/incompatible-library` ×1 (warnings). All pre-existing; compare against that count rather than expecting a clean run.

### Scripts

`backend/scripts/` holds seeds, fixes, and backfills, all run as `node scripts/<name>.js` from `backend/`. The ones that matter beyond seeding:

- `backfill-dcs-groups.js [--force]` — generate `DCSGroup`s for exam groups created before the DCS module (`--force` wipes and regenerates).
- `backfill-duty-room-ref.js` — populate `Duty.roomRef` on legacy duties created before building-aware conflicts.
- `migrate-roles.js` — migrate users from the old single `role` field to the `roles[]` array.
- `release-all-duties.js` / `release-all-dcs.js` — reset duty state during manual testing.

## Where the docs are stale

The README still describes single-role users (`User.role`). **The code is multi-role.** Anything you write against auth must match the actual implementation:

- `User.roles` is a **non-empty array** of `cs | dcs | rs | invigilator`. There is no `role` field.
- Login returns `{ token }` for single-role users, or `{ tempToken, requiresRoleSelection: true }` for multi-role users. A `tempToken` has no `activeRole` claim and is rejected by every protected route except `POST /auth/select-role`, which exchanges it for a real token.
- JWTs carry `{ id, activeRole }`. `shared/middleware/auth.js` (`protect`) rejects tokens with no `activeRole` and re-validates that `activeRole` is still in the user's `roles` on every request. `shared/middleware/allowUnselectedRole.js` is the deliberate exception used only by `/auth/select-role`.
- `requireRole(...)` checks `activeRole`, **not** membership in `roles` — a user with two roles must have selected the right one to pass.
- Roles are derived from designation, not chosen freely: `shared/utils/roleResolver.js` maps `HOD/Dean → [dcs]`, `Professor → [rs]`, `Associate/Assistant Professor → [rs, invigilator]`; only `"Other"` lets the caller pick exactly one role. **`frontend/src/shared/utils/roleResolver.ts` is a hand-maintained mirror — change both.** Backend is the enforcement point; the frontend copy only drives the user form.
- Frontend: `useAuthStore` holds `token` and `tempToken` separately; the axios interceptor prefers `token` and falls back to `tempToken`. `/select-role` is a real route (`RoleSelectionPage`), and a per-user preferred role is remembered in `localStorage`.

`backend/modules/duty-calculation/` (mounted at `/api/duty-calculation`, endpoints listed in the README) computes invigilator workload targets on demand — semester → department → institution duty totals and per-teacher progress. Nothing is persisted; every read recomputes from current DB state. Eligibility is strictly designation-based (`Assistant Professor` / `Associate Professor` only).

`frontend/.env.local` contains `DEV_API_PROXY_TARGET`. Because `vite.config.ts` calls `loadEnv(mode, __dirname, "")` with an **empty prefix**, non-`VITE_` vars in `.env.local` *are* read by the Vite config — they are just never exposed to client code, which still only sees `VITE_`-prefixed vars. Two knobs, easy to confuse:

- `DEV_API_PROXY_TARGET` — where the Vite **dev/preview server** forwards `/api/*`. Must match the backend `PORT`. Node-side only; irrelevant to a build served by anything other than `vite preview`.
- `VITE_API_URL` — the **client's** axios base URL (`VITE_API_URL || "/api"` in `frontend/src/shared/lib/api.ts`). This is the one to set when a built app must call a backend that isn't behind the same origin.

## Architecture invariants

Break these and things fail subtly rather than loudly.

**Conflict detection is role-scoped and building-scoped.** One physical room hosts three independent role slots (DCS, RS, invigilator) simultaneously. `duty.service.js#validateConflicts` therefore *requires* a `role` argument and throws a 500 if it's missing — never call it role-agnostically. Room identity is `roomRef` (ObjectId → `Room`), not the legacy `room` string label, so "004" in Academic Block does not collide with "004" in Lab Block. `Duty` carries both fields; every new building-sensitive query must use `roomRef`. The same rule applies in `examGroup.getDutyStatus`, `changeRequest.isInvigilatorAlreadyAssigned`, and the frontend selection utilities (which compare `examRoom.room._id`).

**Which role slot a duty fills is resolved, not assumed.** Self-assign takes the slot from the caller's `activeRole`; admin-assign takes it from `body.role`, validated against the target teacher's `roles`, and only infers it when the teacher has exactly one duty-eligible role (`cs` is excluded — CS holds no duty slots). Ambiguity is a 400, not a guess.

**Multi-document writes go through `withOptionalTransaction`.** It runs the body in a Mongo transaction on replica sets and silently re-runs it *without* a session on standalone Mongo (local dev). Consequences: every repository helper must accept `session === null` as "no session", and the body must be safe to re-run after a failed transaction attempt. Group claims, group-swap approvals, exam finalize, and cascade deletes all rely on this.

**DCS groups are persisted; RS groups are derived.** `DCSGroup` is a real collection generated at exam-finalize time and sized `ceil(totalStudents / 300)` per schedule. RS groups exist only as a client-side chunking of the same `AvailableDutySlot` list, keyed `${scheduleId}:${buildingId}:${chunkIndex}` — that exact key format is shared by Select Duty, Upcoming Duties, Change Requests, and the Dashboard, so changing it in one place desyncs all four. Because RS groups have no server-side identity, an `rs_swap` change request snapshots concrete `rsSourceDuties[]` + `rsTargetExamRooms[]` IDs at submit time and a `rsSourceKey` whose unique index prevents double-swapping one group.

**Group parity for group roles.** DCS and RS see *groups* on every surface — never per-room cards, never per-room swaps. Invigilators see individual rooms. A change that makes a group role show a single room is a bug, not a simplification.

**Delivery channels hang off the notification emitter, not off call sites.** Any module that calls `notification.emitter.js` gets the email and WhatsApp copies automatically, for the types in `email.dispatcher.js`'s `EMAILABLE_TYPES` and `whatsapp.dispatcher.js`'s `WHATSAPPABLE_TYPES` — do not add a second "and also send a…" step to a service. The two channels are dispatched independently on purpose: a dead SMTP host must not stop the WhatsApp message, and a dropped WhatsApp session must not stop the email. Two rules the email path must keep: it never throws into the caller (a dead SMTP host produces a `failed` EmailLog row, not a 500; likewise WhatsAppLog), and it never sends from inside an open transaction. The second is enforced by `shared/utils/postCommit.js`: the emitter registers the send via `onCommit(session, …)`, and `withOptionalTransaction` flushes only after a successful commit, discarding on abort. If you add a new transactional flow, route external side effects through `postCommit` the same way.

**Email and WhatsApp are optional and must stay optional.** With no SMTP env vars, or no `WHATSAPP_PROVIDER`, the app runs unchanged; sends are recorded as `skipped_not_configured` in `EmailLog` / `WhatsAppLog`. Never make a code path depend on either having gone out, and never let a missing transport fail a request. `whatsapp-web.js` is an *optional npm dependency* loaded through a guarded `require` — its absence must stay a disabled feature, never a boot failure.

**Reminder idempotency is a claimed `dedupeKey` per channel, not a "have I sent this?" check.** `reminder.service.js` derives one key — `reminder:<lead>:<teacherId>:<bucket>` — and claims it separately on each channel (`notify:` prefix on `Notification`, bare on `EmailLog`, `wa:` prefix on `WhatsAppLog`), each with a unique partial index, *before* writing or sending. This is what makes the job safe to re-run, which the 15-minute cron and the manual `POST /reminders/run` both rely on. Don't add a send to the reminder path that bypasses the claim.

The per-channel split matters: an earlier version let the email log's claim gate all channels, which meant a teacher with no email address consumed the shared claim and silently lost the in-app notification too. Channels that fail independently must claim independently.

**Reminder windows come in two kinds.** `7d`/`1d` are `daily`: they fire once at `REMINDER_DAILY_HOUR` and sweep the *whole* target day into one digest. `2h` is `slot`: it fires on an instant range around each shift. Running the day-leads on the slot rule looks correct until a teacher has two duties on one day — the first claims the day's bucket and the second is silently deduped away and never reminded. Keep the two kinds distinct in `reminder.windows.js`.

**`reminder.service.js` requires the models it populates.** It runs from the cron and from standalone scripts, neither of which loads `app.js`, so the `require` calls for `ExamSchedule` / `ExamGroup` / `ExamRoom` / `Room` / `Building` are load-bearing side effects, not dead imports. Same applies to any new service driven outside the Express app.

**WhatsApp provider choice is a deployment constraint, not a preference.** `cloud_api` is stateless and runs anywhere. `webjs` holds a session on disk, so it needs exactly one instance and a persistent volume — never an autoscaling group, never ephemeral storage — plus Chromium, ~2GB RAM, and a human to re-scan the QR when the session drops. It also violates WhatsApp's ToS. Everything above the adapter interface in `providers/index.js` is provider-agnostic; keep it that way so switching stays an env change.

**Phone numbers are normalised, never used raw.** `User.phone` is free text. Everything goes through `whatsapp/phone.utils.js` to E.164 before it addresses a message, and ambiguous input is *rejected* rather than guessed at — a misrouted duty reminder reaches a real stranger. Unusable numbers are recorded as `skipped_invalid_number` so a bad roster shows up as data rather than silence.

**Broadcast targeting intersects.** `roles` and `departments` are ANDed in `findBroadcastRecipients` — "all RS in CSE", not "every RS plus everyone in CSE". An untargeted broadcast is rejected at the service layer on purpose; selecting every role is how you reach everyone.

## Conventions

- **Backend module** = `backend/modules/<domain>/` with `.controller.js` → `.service.js` → `.repository.js` → `.model.js` → `.routes.js`. No cross-domain repository calls; go through the other domain's service. Mount new routes in `backend/app.js`.
- **Frontend module** = `frontend/src/modules/<domain>/` owning its own `components/ hooks/ services/ types.ts` (and `pages/ utils/` where useful). Imports flow one way: role-specific → `modules/shared/`.
- The three operational roles (invigilator, rs, dcs) share one page set and differ only by config: `frontend/src/modules/shared/role-config/roleConfig.ts` holds base path, nav items, and the `RoomDutyFlags` key each role occupies (`invigilatorAssigned` / `rsAssigned` / `dcsAssigned`). Add a role-specific page by extending the config, not by forking the nav.
- Errors: throw `AppError(message, status)`, wrap async controllers in `catchAsync`; `shared/middleware/errorHandler` is mounted last in `app.js`.
- Emit a notification via `notification.emitter.js` for any user-visible state change; the typed set is `duty_assigned`, `duty_cancelled`, `request_submitted`, `request_approved`, `request_rejected`, `duty_swapped`, `exam_deleted_duty_release`, `duty_reminder` (scheduled), `admin_message` (CS broadcast).
- `Exam` and `User` are soft-deleted via `isActive` with a Mongoose `pre(/^find/)` hook that excludes them automatically — pass an explicit `isActive` filter to see deleted records.
- Path alias `@/` → `frontend/src/`.
