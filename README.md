# Exam Duty

A role-based web application for planning exams and distributing invigilation duties across an academic institution. Administrators plan exam schedules and allocate rooms; supervision staff (CS, DCS, RS) manage groups of rooms; invigilators claim or swap individual duties. Every action flows through building-aware conflict detection, per-role slot independence, and an approval workflow for changes.

## Roles

A user holds one *or more* of four roles. They live in `User.roles`, a non-empty array on the `User` document (`backend/modules/auth/auth.model.js`) — there is no single `role` field. A token is bound to one **active role** at a time: a single-role user gets it straight from login, a multi-role user picks one at `POST /auth/select-role` first. Authorization checks that active role, not membership in `roles`, so a user who holds two roles must be acting as the right one to pass. The active role also drives which frontend route tree they land in.

| Role | Full Name | Grain | Responsibilities |
| --- | --- | --- | --- |
| **CS** | Controller of Superintendents | System | Full admin — creates exams, departments, rooms, users; reviews change requests; assigns duties directly. |
| **DCS** | Deputy Controller of Superintendents | Room *group* (student-count sized, one DCS per ≤300 students) | Claims a supervision group; oversees every room in the group; submits `dcs_swap` requests. Approval is CS-only. |
| **RS** | Room Superintendent | Room *group* (chunks of ≤5 rooms per building + time slot) | Claims a room group; supervises up to 5 rooms in the same block during a shift. |
| **Invigilator** | Faculty Invigilator | Single room | Self-assigns or is assigned a single room per time slot; submits change requests. |

Group vs. individual is the key mental model: **DCS and RS work on whole groups**; **Invigilators work on individual rooms**. Every screen a group role sees — Select Duty, Upcoming Duties, Change Requests, Dashboard — is grouped, never per-room.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Vite 6 · React 19 · TypeScript 5 · Tailwind CSS 4 · React Router 7 |
| Mobile | Expo SDK 57 · React Native 0.86 · expo-router · TypeScript 6 |
| State | Zustand (client state) · TanStack React Query (server cache) |
| Backend | Node.js · Express 4 |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (bcrypt-hashed passwords) |
| Dev | nodemon (backend hot-reload) · Vite HMR (frontend) · Expo Go / Metro (mobile) |

The mobile app is the **operational** surface only — Invigilator, RS and DCS.
Exam planning and change-request approval are CS work and stay on the web. See
`mobile/README.md`.

## Feature Overview

### Exam Planning (CS)
- **Create Exams** wizard for both CIE (IA1/IA2/IA3) and SEE (Semester End). Handles department selection, date auto-calculation from shifts, room allocation, seat-sharing configuration, and DCS group formation in a single transactional finalize call.
- **Exams** — list, filter, edit; timetable per exam with per-room duty status.
- **Departments** — CRUD for departments, semesters, courses (core / professional elective / open elective), and elective groups.
- **Infrastructure** — buildings and rooms with capacity, floor, and bulk-import support.
- **Users** — teacher profiles with role and department; one-time admin bootstrap endpoint.

### Duty Assignment
- **Admin-assign** — CS can force any teacher into any slot (`POST /api/duties/admin-assign`).
- **Self-assign** — Invigilators claim single rooms; RS and DCS claim groups (one API call creates a duty per room in the group, transactionally).
- **Conflict detection** — every self-assign and admin-assign runs through two independent guards:
  - *Teacher conflict:* same teacher, same date, overlapping times → reject.
  - *Room conflict:* scoped by the room's ObjectId (`roomRef`) so the same room number in a *different building* does NOT collide, and scoped by role so DCS/RS/Invigilator slots on the same room are independent.

### Change Requests
Every role can propose a change; only CS approves or rejects (`PATCH /:id/approve` and `/:id/reject` are guarded `requireRole("cs")`). Approval is atomic — either the whole change lands or nothing does.

| Scope | Type | Used by | Behavior on approval |
| --- | --- | --- | --- |
| `duty` | `swap` | Invigilator | Duty's `teacher` field flips to the swap partner. |
| `duty` | `drop` | Invigilator | Duty → cancelled. |
| `duty` | `move` | Invigilator | Old duty cancelled, new duty created on the target `examSchedule`/`examRoom`. |
| `dcs_group` | `dcs_swap` | DCS | Source group's duties cancelled, target group claimed for the requester. |
| `rs_group` | `rs_swap` | RS | Source group's duties cancelled, one new duty per target-group room created for the requester. |

RS groups aren't persisted server-side (they're derived from `schedule + building + chunk` on the client). The RS change request snapshots the source duty IDs and target `examRoom` IDs so approval can operate on a stable set of records.

### DCS Group Sizing
DCS supervision groups are generated at exam-creation time (in the same finalize call that creates the `ExamGroup`, `ExamSchedule`s, and `ExamRoom`s). Sizing is per-schedule and locked at creation:

- **N (DCS required per schedule)** — `ceil(totalStudents / 300)`.
- **`totalStudents`** — sum of `Semester.studentCount` for each unique `(department × examGroup.semester)` pair represented in that schedule's rooms. It uses the full semester roster, not per-subject registrations or attendance.
- **Room distribution** — rooms are sorted numerically and split into `N` chunks; when rooms don't divide evenly, the first few chunks each get one extra room.
- **Fallback** — a schedule with rooms but zero resolved students still gets one DCS group (never leave rooms unsupervised).

Formula source: `backend/modules/dcs/dcsCalculation.utils.js`. Generation entry point: `dcsGroupService.generateDCSGroupsForExamGroup(examGroupId)`, invoked from `finalizeCIEPlan` / `finalizeSEEPlan`. For exams created before the module existed (or when a resize is needed), run `node backend/scripts/backfill-dcs-groups.js` (add `--force` to wipe existing groups and regenerate).

### Seat Sharing
Exams that overlap in time can share leftover seats. During finalize, consumer exams detect overlapping shareable rooms and atomically decrement `remainingSeats` (with a `$gte` guard to prevent double-claim). Post-hoc marking, unmarking, and per-schedule allocation views are exposed under `/api/seat-sharing`.

### Notifications
Typed in-app notifications with a central emitter (`backend/modules/notification/notification.emitter.js`):

`duty_assigned`, `duty_cancelled`, `request_submitted`, `request_approved`, `request_rejected`, `duty_swapped`, `exam_deleted_duty_release`.

Plus two more that the email/reminder work added: `duty_reminder` (scheduled) and `admin_message` (CS broadcast).

Notifications reference either a `Duty` or a `ChangeRequest` for deep-linking. Unread count and read-all endpoints back the UI bell.

Every emit also fans out to the three outbound channels — email, WhatsApp, and push — off that same emitter, so a module that emits never has to remember a second "and also send a…" step. Each channel's dispatcher decides which types warrant a copy (`email.dispatcher.js`, `whatsapp.dispatcher.js`, `push.dispatcher.js`), and today all three cover the same set: every type above except `duty_reminder`, which the reminder job delivers under its own at-most-once claim. The three are queued independently, so a dead SMTP host, a dropped WhatsApp session, and a push failure can each only take out their own channel.

### Email
Every notification type above except `duty_reminder` is emailed through the same emitter that writes the in-app copy — modules keep calling `notification.emitter.js` and the email follows automatically (`backend/modules/email/email.dispatcher.js` decides which types warrant one).

- **Optional by design.** With no SMTP config the app behaves exactly as before; each send is written to `EmailLog` with status `skipped_not_configured` and nothing is lost. Add the env vars, restart, and delivery starts.
- **Transaction-safe.** Emails queued from inside a transaction are held by `shared/utils/postCommit.js` and flushed only after the commit — a rolled-back duty assignment never reaches an inbox.
- **Never fails the request.** A dead SMTP host produces a `failed` row in `EmailLog`, not a 500. The in-app notification has already landed.
- **Audited.** `EmailLog` records every attempt — `sent`, `failed`, `skipped_not_configured`, `skipped_opted_out` — with the subject, recipient, and error. `GET /api/reminders/health` surfaces a 7-day rollup.
- **Opt-out.** `User.emailNotifications` (default `true`) gates only the email copy; in-app delivery is never affected. Users toggle it from the notification panel.

Templates live in `backend/modules/email/email.templates.js` — table-based layout, inline styles, no external assets, and a plain-text twin for every HTML body.

### Duty Reminders
An in-process cron (`backend/modules/reminder/`) reminds every teacher about upcoming duties **1 week**, **1 day**, and **2 hours** ahead, on all four channels — in-app notification, email, WhatsApp, and push (`deliverDigest` in `reminder.service.js` fans out to one branch each).

Two kinds of window, because the two kinds of statement differ:

| Lead | Kind | Fires | Covers |
| --- | --- | --- | --- |
| `7d` / `1d` | daily | once, at `REMINDER_DAILY_HOUR` on the lead day | every duty on the target day, as one digest |
| `2h` | slot | ~2 hours before each shift | the duties starting in that slot |

Digesting is the point: a DCS supervising five rooms tomorrow gets one "you have 5 duties tomorrow" message, not five.

Idempotency comes from one shared key suffix — `reminder:<lead>:<teacherId>:<bucket>` — claimed **once per channel, independently**, before that channel delivers: `notify:<key>` on `Notification`, the bare `<key>` on `EmailLog`, `wa:<key>` on `WhatsAppLog`, and `push:<key>` on `PushLog`. Each carries its own unique partial index, so a duplicate claim is a `11000` that the repository turns into "already delivered, skip".

Push claims one key *per device* — `push:<key>#<token>` — because it is the only channel that fans out: a teacher with a phone and a tablet is two sends with two outcomes, and a single user-level claim would let whichever device went first silently gate the rest.

The per-channel split is deliberate. An earlier design let the `EmailLog` claim gate all of them, which coupled things that fail separately: a teacher with no email address consumed the shared claim and silently lost the in-app notification too. Four claims give four independent outcomes — and re-running is still safe, which is what lets the cron tick every 15 minutes (needed for the 2-hour window to land accurately) and lets an admin press **Run now** without risking duplicates.

A run reports each channel separately: `byChannel.{inApp,email,whatsapp,push}` rolls the per-window statuses up into `sent` / `duplicate` / `failed` / `skipped`, and `totals` sums the three outbound channels. Push's own statuses fold in there too — `unregistered` (Expo says the app is gone and the token has been deleted) and `no_device` (nobody has registered one) count as skipped, not failed.

Known trade-off: a duty assigned *after* that day's digest has gone out shares the already-claimed bucket, so it gets no day-lead reminder of its own. It still triggers an immediate `duty_assigned` email and the 2-hour nudge.

### Sending Notifications Manually
CS gets a **Send Notification** page (`/notifications`) to message staff directly. Recipients are targeted by **role** and/or **department**; the two filters intersect, so "RS" + "CSE" means RS staff in CSE. An untargeted send is rejected — selecting every role is the explicit way to reach everyone.

The screen resolves and displays the recipient list (and how many will actually be reached on each channel) before anything sends, and the same page carries the reminder scheduler's status, SMTP and WhatsApp health, recent send counts, a queue preview, and manual triggers.

The in-app copy always goes out. Email is on unless switched off (`sendEmail`); WhatsApp and push are opt-in ticks (`sendWhatsApp`, `sendPush`), because both interrupt a personal device. The preview reports reach per channel — `withEmail` / `withWhatsApp` / `withPush`, each with its "no address / no number / no device" and "opted out" counterpart, plus `pushDevices`, the number of *sends* those reachable people represent, since push addresses devices and one person may have several. A send answers with per-status counts for each channel it was asked to use; the push block additionally separates `attempted` (messages, i.e. devices) from `reached` (people) and `noDevice`.

### WhatsApp
The third delivery channel, hanging off the same emitter as email. Duty reminders, duty assigned/cancelled, change-request outcomes, and admin broadcasts all go out on it.

Optional in exactly the way email is: with no provider configured, every message is recorded in `WhatsAppLog` as `skipped_not_configured` and nothing else changes.

**Two interchangeable providers**, chosen with `WHATSAPP_PROVIDER`. The rest of the code only sees the adapter interface, so moving between them is an env change and a restart:

| | `cloud_api` | `webjs` |
| --- | --- | --- |
| Library | none (Graph API over HTTPS) | `whatsapp-web.js` + headless Chromium |
| Official | yes — Meta's WhatsApp Business Platform | no — automates WhatsApp Web |
| State | stateless | session on disk, must persist |
| Scaling | any number of instances | exactly one instance |
| Memory | negligible | ~500MB-1GB for Chromium |
| Setup | Meta Business account, verified number, approved templates | scan a QR |
| Cost | per-conversation pricing | free |
| Risk | none | violates WhatsApp ToS; the number can be banned |

`whatsapp-web.js` is an **optional dependency** and is not installed by default, because of the Chromium download. The app reports the provider as unconfigured rather than crashing when it's absent. To enable:

```bash
cd backend && npm install whatsapp-web.js qrcode-terminal
```

**The 24-hour rule.** The Cloud API only allows free-form text to someone who messaged you in the last 24 hours — which a duty reminder never satisfies. Those sends therefore go out as **pre-approved templates**. `backend/modules/whatsapp/whatsapp.templates.js` declares, for each message, both the literal text and the ordered variables; register a matching template in Meta Business Manager under the declared `template.name` with `{{1}}`, `{{2}}`… where the variables go. `WHATSAPP_ALLOW_TEXT=true` bypasses templates for testing against a number that has just messaged the business.

**Phone numbers.** `User.phone` is free text, so everything is normalised to E.164 by `phone.utils.js` before use — `"98450 12345"`, `"+91 98450-12345"` and `"09845012345"` all resolve to `+919845012345`, while anything ambiguous is rejected rather than guessed at. Bare numbers get `DEFAULT_COUNTRY_CODE` (default `+91`); numbers written with a `+` are taken as-is. `GET /api/whatsapp/coverage` reports how much of the roster is actually reachable — worth checking before relying on the channel, since a healthy provider still sends nothing to staff with no number on file.

**Linking a `webjs` session.** The QR is printed to the server log *and* rendered inline on the Send Notification page, so linking doesn't mean reading a QR out of CloudWatch. It rotates every few seconds and the page refreshes it automatically.

### Deploying on AWS
The channel choice is really a deployment choice.

**`cloud_api` runs anywhere** — EC2, ECS/Fargate, App Runner, Elastic Beanstalk, Lambda. It holds no state, so instances can come and go freely.

**`webjs` constrains the architecture** and needs all of the following:

- **A single instance.** Two processes sharing one WhatsApp session will fight and get the number logged out. No autoscaling group, no rolling deploys onto a second task; use `desiredCount: 1` and a `Recreate` deployment.
- **A persistent volume** for `WHATSAPP_SESSION_PATH`. An EBS volume on EC2, or EFS for ECS. Anything ephemeral means re-scanning the QR on every deploy — including every crash-restart.
- **Chromium and its system libraries.** The bundled download needs `libnss3`, `libatk-1.0-0`, `libatk-bridge2.0-0`, `libcups2`, `libdrm2`, `libxkbcommon0`, `libxcomposite1`, `libxdamage1`, `libxfixes3`, `libxrandr2`, `libgbm1`, `libpango-1.0-0`, `libcairo2`, `libasound2` and friends. On Amazon Linux 2023 it is usually less painful to `dnf install chromium` and point `PUPPETEER_EXECUTABLE_PATH` at it.
- **Real memory.** Chromium plus Node needs ~2GB to be comfortable; `t3.micro` will OOM. `t3.small` is the realistic floor, `t3.medium` comfortable.
- **`--no-sandbox`**, already set in the adapter, since the process rarely has the kernel namespaces Chrome's sandbox wants.
- **A human with the phone**, at first link and again whenever the session drops (phone offline for days, WhatsApp logging the device out, a Chromium crash). It is not a set-and-forget component.

It also violates the WhatsApp Terms of Service. For an internal pilot on one box that is a considered risk; for the institution's main number, a ban takes out the channel entirely.

**The pragmatic path**: run `webjs` on a single EC2 instance while piloting, and switch `WHATSAPP_PROVIDER=cloud_api` before the system carries real exam load. No application code changes between the two.

### Exam Cleanup
Deleting an exam group, schedule, or room cascades in a single transaction (`backend/modules/exam-cleanup/services/examDeletionService.js`): all dependent duties are cancelled, open change requests are marked `cancelled_exam_deleted`, seat-sharing allocations are released (and source rooms' `remainingSeats` restored), and affected teachers receive `exam_deleted_duty_release` notifications.

## Domain Model

Backend uses Mongoose models under `backend/modules/*/[name].model.js`.

| Model | Purpose |
| --- | --- |
| `User` | Auth principal with `roles: [cs | dcs | rs | invigilator]` (non-empty array), department, designation, `isActive`. |
| `Department` / `Semester` / `Course` / `ElectiveGroup` | Academic taxonomy. `Course.courseType ∈ {core, professional_elective, open_elective}`. |
| `Building` / `Room` | Physical infrastructure. `Room` is unique per `(building, roomNumber)`. |
| `Exam` | Legacy single-exam entity. Retained for old flows; new work uses `ExamGroup`. |
| `ExamGroup` | Structured top-level: `examType ∈ {IA1, IA2, IA3, SEE}`, `semester`, date range. |
| `ExamSchedule` | One schedule per exam date; belongs to an `ExamGroup`. |
| `ExamRoom` | Allocates a physical `Room` to a `Schedule`, with per-department seat metadata. |
| `Duty` | Assignment of a teacher to a slot. Carries both `room` (string label, legacy) and `roomRef` (ObjectId → `Room`, building-aware). Indexed on `(teacher, date, startTime, status)`, `(room, …)`, and `(roomRef, …)`. |
| `DCSGroup` | Persistent supervision group sized by student count. Tracks `assignedRooms`, `assignedTeacher`, `duties`, `status ∈ {open, claimed, released}`. |
| `ChangeRequest` | `scope ∈ {duty, dcs_group, rs_group}` × `type ∈ {swap, drop, move, dcs_swap, rs_swap}`. RS scope snapshots `rsSourceDuties[]` + `rsTargetExamRooms[]` and a `rsSourceKey` (schedule:building:chunk) for uniqueness. |
| `Notification` | Typed in-app notification. |
| `RoomSharingConfiguration` / `SharedSeatAllocation` | Seat-sharing pool + per-consumer allocation with atomic remaining-seats counter. |

## Workflows by Role

### CS — Administrator
1. **Bootstrap** the first admin via `POST /api/users/bootstrap`, log in.
2. Set up **Departments** (with semesters, courses, elective groups) and **Infrastructure** (buildings + rooms).
3. Create **Users** for faculty and assign roles.
4. Open **Create Exams**:
   - Pick CIE or SEE.
   - Select departments and semester, configure shifts and start date; dates auto-calculate.
   - Assign rooms per shift; the finalize call transactionally creates the `ExamGroup`, all `ExamSchedule`s, `ExamRoom`s, `DCSGroup`s (sized by student count), and any `RoomSharingConfiguration`s for overlapping shareable rooms.
5. Optionally **admin-assign** duties directly from **Manage Duties**.
6. Review **Change Requests** — approve/reject `duty`, `dcs_group`, and `rs_group` scoped requests.
7. Optionally delete an exam group/schedule/room — cascade releases all duties and notifies affected teachers.

### DCS — Group Supervisor
1. **Dashboard** — group-oriented hero band (upcoming groups, total rooms, total students).
2. **Select Duty** — browses `DCSGroup`s available for the exam; each group covers a subset of rooms in one schedule (sized so no DCS supervises more than 300 students) and lists its rooms. Claiming a group creates one `Duty` per room atomically.
3. **Upcoming Duties** — one card per claimed group with the room list and (per room) the assigned invigilator's contact.
4. **Change Requests** — swap a whole claimed group for another open group (`type = dcs_swap`). Cannot swap individual rooms.
5. **Exams** — read-only exam browser.

A DCS submits change requests like everyone else; reviewing them is CS-only.

### RS — Room Group Supervisor
1. **Dashboard** — group-oriented hero band (upcoming groups, total rooms, buildings).
2. **Select Duty** — rooms are chunked into groups of 5 per `(examGroup, schedule, date, startTime, endTime, buildingId)` and sorted numerically. Claiming a group creates one `Duty` per room atomically.
3. **Upcoming Duties** — one card per group (`Academic Block — Rooms 004–412`) with per-room chips, not one card per room.
4. **Change Requests** — swap a whole group for another available RS group. Submits a single `rs_swap` request that snapshots source duty IDs + target `examRoom` IDs and a `rsSourceKey`; the unique index prevents double-swapping the same source group.
5. **Exams** — reuses the invigilator exam browser.

RS groups are derived (not persisted) using a stable partition key `${scheduleId}:${buildingId}:${chunkIndex}` — the same key format is used by Select Duty, Upcoming Duties, Change Requests, and the Dashboard, so the RS sees a consistent group across every surface.

### Invigilator — Faculty
1. **Dashboard** — per-duty cards for upcoming and completed shifts.
2. **Select Duty** — grid or table of available room slots for the exam. Slots are filtered by:
   - Slot lifecycle (past schedules hidden).
   - Per-role occupancy (`flags.invigilatorAssigned`).
   - Teacher's own time conflicts (across all assigned duties).
   - Building-aware room identity (a duty on Academic Block 004 does **not** shadow Lab Block 004).
3. **Upcoming Duties** — one card per assigned duty, grouped by date and time slot.
4. **Change Requests** — submit `swap` (with a partner), `drop` (with reason), or `move` (to a listed vacant slot).
5. **Exams** — timetable with the invigilator's own duty highlighted.

## Project Structure

```
exam-duty/
├── backend/
│   ├── server.js                    # Entry — connects DB, starts server
│   ├── app.js                       # Express setup, CORS, route mounting
│   ├── modules/
│   │   ├── auth/                    # Register, login, JWT, /me
│   │   ├── user/                    # User CRUD, bootstrap
│   │   ├── department/              # Dept + Semester + Course + ElectiveGroup
│   │   ├── infrastructure/          # Building + Room
│   │   ├── exam/                    # Legacy Exam + ExamGroup/Schedule/Room
│   │   ├── create-exams/            # CIE + SEE finalize (transactional)
│   │   ├── duty/                    # Assign/self-assign/cancel, conflict scan
│   │   ├── duty-calculation/        # On-demand invigilator workload targets + progress
│   │   ├── dcs/                     # DCSGroup formation, claim, release
│   │   ├── change-request/          # duty / dcs_group / rs_group scopes
│   │   ├── seat-sharing/            # Shareable rooms + atomic allocation
│   │   ├── notification/            # Emitter + typed notifications
│   │   ├── email/                   # SMTP transport, templates, EmailLog audit
│   │   ├── whatsapp/                # Provider adapters, templates, WhatsAppLog audit
│   │   ├── reminder/                # Reminder cron, lead windows, per-channel claims
│   │   ├── exam-cleanup/            # Cascade delete + release
│   │   ├── audit/                   # Stub
│   │   └── report/                  # Stub
│   ├── scripts/                     # Seed + backfill helpers
│   └── shared/                      # DB config, auth middleware, utils
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                  # Router root — public + protected + role trees
│   │   ├── main.tsx                 # Vite entry, React Query provider
│   │   ├── modules/
│   │   │   ├── auth/                # Login form + hooks
│   │   │   ├── dashboard/           # Admin dashboard
│   │   │   ├── create-exams/        # CIE + SEE wizards, room allocation, sharing
│   │   │   ├── exams/               # List/filter/timetable
│   │   │   ├── manage-duties/       # Per-teacher duty admin
│   │   │   ├── users/               # Teacher CRUD
│   │   │   ├── departments/         # Dept + sem + course admin
│   │   │   ├── infrastructure/      # Buildings + rooms
│   │   │   ├── change-requests/     # Admin review page
│   │   │   ├── notifications/       # Bell + list
│   │   │   ├── reminders/           # Scheduler status card, health + preview + run now
│   │   │   ├── whatsapp/            # Provider health card, QR, coverage, test send
│   │   │   ├── duties/              # Duty types + admin actions
│   │   │   ├── invigilator/         # Invigilator role tree
│   │   │   │   ├── routes/          # /invigilator/*
│   │   │   │   ├── exams/           # Exam list + details
│   │   │   │   ├── select-duty/     # Per-room grid picker
│   │   │   │   ├── upcoming-duties/ # Per-room cards
│   │   │   │   ├── change-requests/ # Per-duty swap/move/drop
│   │   │   │   └── duties/          # dutySelectionUtils (building-aware match)
│   │   │   ├── rs/                  # RS role tree — group-oriented
│   │   │   │   ├── routes/          # /rs/*
│   │   │   │   ├── pages/           # Dashboard (uses group normalizers)
│   │   │   │   ├── select-duty/     # Group-of-5 picker
│   │   │   │   ├── upcoming-duties/ # Group cards + range labels
│   │   │   │   └── change-requests/ # Group swap (rs_swap)
│   │   │   ├── dcs/                 # DCS role tree — group-oriented
│   │   │   │   ├── routes/          # /dcs/*
│   │   │   │   ├── pages/           # Dashboard (uses DCS group normalizers)
│   │   │   │   ├── select-duty/     # Student-count-sized groups
│   │   │   │   ├── upcoming-duties/ # Group cards + invigilator contact list
│   │   │   │   └── change-requests/ # Group swap (dcs_swap)
│   │   │   └── shared/
│   │   │       ├── change-requests/ # Shared ChangeRequestCard + types + hooks
│   │   │       ├── exams/           # Shared exam data hooks + selectors
│   │   │       ├── dashboard/       # Shared hero + section + normalizers
│   │   │       └── role-config/     # Per-role UI config (nav, flag key, path)
│   │   └── shared/
│   │       ├── components/          # AuthGuard, Sidebar, ProtectedLayout
│   │       ├── store/               # Zustand auth + app stores
│   │       ├── lib/                 # Axios API client, types, navigation
│   │       └── ui/                  # Reusable primitives
│   └── package.json
│
├── mobile/                          # Expo app — Invigilator / RS / DCS only
│   ├── app/                         # expo-router file routes
│   │   ├── _layout.tsx              # Providers + Stack.Protected auth guard
│   │   ├── index.tsx                # Forwarder → dashboard / select-role / login
│   │   ├── (auth)/                  # login, select-role
│   │   └── (app)/                   # Six-tab bar: dashboard, exams, select-duty,
│   │                                #   upcoming-duties, change-requests, notifications
│   ├── src/
│   │   ├── api/                     # axios client (base URL + token interceptors), auth calls
│   │   ├── features/
│   │   │   ├── dashboard/           # One dashboard, three role shapes
│   │   │   ├── exams/               # Read-only exam browser
│   │   │   ├── duties/              # Select Duty + Upcoming Duties, per role
│   │   │   ├── change-requests/     # Swap / move / drop panels, per role
│   │   │   └── notifications/       # Alerts inbox + channel preferences
│   │   ├── push/                    # Expo push token registration, routing, /push/tokens
│   │   └── shared/                  # Auth store (SecureStore), role config, mirrored types
│   ├── app.json                     # Expo config — scheme, plugins, extra.apiUrl
│   └── package.json
│
├── README.md
├── APP_FLOW.md                      # End-to-end walkthrough
├── CREDENTIALS.md                   # Seeded test logins
└── NGROK_SETUP_GUIDE.md             # Optional public tunnel setup (stale — pre-Vite)
```

Each backend module follows the **controller → service → repository → model** pattern. Each frontend feature module owns its own `components/`, `hooks/`, `services/`, `types.ts`, and (where useful) `utils/` — cross-module imports are one-way from role-specific → shared.

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or a connection URI to a remote instance)

### Setup

```bash
git clone <repository-url>
cd exam-duty
```

**Backend**
```bash
cd backend
npm install
```

Create `backend/.env` — copy `backend/.env.example` and fill it in:
```env
PORT=5001               # not 5000 — macOS gives that to ControlCenter (AirPlay Receiver)
MONGO_URI=mongodb://localhost:27017/exam-duty
NODE_ENV=development
JWT_SECRET=change-me
JWT_EXPIRES_IN=7d

# --- Email (optional) -------------------------------------------------
# Leave these out and the app runs exactly as before: in-app notifications
# still fire and every would-be email is recorded in EmailLog as
# `skipped_not_configured`. Fill them in and restart to start sending.
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=            # "true" to force TLS-on-connect; defaults to port===465
MAIL_FROM=Exam Duty <no-reply@yourdomain.edu>
MAIL_REPLY_TO=
APP_URL=http://localhost:5173   # used for the links inside emails
EMAIL_ENABLED=true      # "false" kills sending even when SMTP is set

# --- Duty reminders ---------------------------------------------------
REMINDERS_ENABLED=true  # "false" disables the cron; manual runs still work
REMINDER_CRON=*/15 * * * *
REMINDER_DAILY_HOUR=18  # local hour the 1-week / 1-day digests go out
REMINDER_TICK_MS=900000 # catch-up slack; keep >= the cron interval
REMINDER_TIMEZONE=      # IANA zone, e.g. Asia/Kolkata. Applies ONLY to the node-cron
                        # schedule (and the /api/reminders/health readout). Every window
                        # calculation — REMINDER_DAILY_HOUR included — uses server local
                        # time, so on a server whose clock is in another zone the digests
                        # still go out at the SERVER's local hour, not this one.

# --- WhatsApp (optional) ----------------------------------------------
# Same story as email: leave unset and every message is logged and skipped.
WHATSAPP_PROVIDER=          # cloud_api | webjs | none
DEFAULT_COUNTRY_CODE=+91    # applied to numbers stored without one

# ...if WHATSAPP_PROVIDER=cloud_api (recommended for AWS):
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_API_VERSION=v21.0
WHATSAPP_TEMPLATE_LANG=en
WHATSAPP_ALLOW_TEXT=false   # true sends free-form instead of templates (testing only)

# ...if WHATSAPP_PROVIDER=webjs:
WHATSAPP_SESSION_PATH=./.wwebjs_auth   # MUST be on a persistent volume
WHATSAPP_HEADLESS=true
PUPPETEER_EXECUTABLE_PATH=             # system Chromium, if not using the bundled one
```

**Frontend**
```bash
cd ../frontend
npm install
```

(No `.env` needed for local dev — the Vite dev and preview servers proxy `/api/*` to
`http://localhost:5001` by default, matching the backend's default `PORT`. If the backend
runs on some other port, copy `frontend/.env.example` to `frontend/.env.local` and point
`DEV_API_PROXY_TARGET` at it.

That proxy target is a dev-server setting and never reaches the browser. The client's own
base URL is a separate variable, `VITE_API_URL`, defaulting to the same-origin `/api` —
set it only when a built app must call a backend on another origin, with no Vite proxy in
front of it. Both are documented in `frontend/.env.example`.)

**Mobile** (optional — skip it if you are only working on the web app)
```bash
cd ../mobile
npm install --legacy-peer-deps
```

`--legacy-peer-deps` is required, not a workaround for a broken lockfile: two
`react-native-worklets` versions inside Expo's own dependency tree fail npm's strict
resolver. `npx expo-doctor` passes regardless.

Then copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_URL` to the
backend's **LAN** address including `/api` — a phone cannot reach your laptop's
`localhost`. `mobile/README.md` covers both the LAN-IP and the ngrok route.

### Running

```bash
# Terminal 1 — backend (hot-reloaded)
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev

# Terminal 3 — mobile, only when you need it (own terminal: expo start is interactive)
cd mobile && npx expo start
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001
- Mobile: scan the Metro QR code with Expo Go, or press `i` / `a` for a simulator

From the repo root, `npm run dev` starts backend + frontend together. It deliberately
leaves the mobile app out: `expo start` owns its terminal — it renders a QR code and
reads single keypresses (`i`, `a`, `r`, `j`) from raw stdin, neither of which survives
`concurrently`'s line-prefixed multiplexing. `npm run dev:mobile` is there as a
shortcut, but run it in its own terminal.

### Seed Data

```bash
cd backend
node scripts/seed-users.js         # Test logins (see CREDENTIALS.md)
node scripts/seed-departments.js   # 5 departments × 8 semesters + core courses
node scripts/seed-electives.js     # 2+ electives per (dept, sem)
node scripts/fix-elective-groups.js # Group electives under ElectiveGroup docs
node scripts/seed-rooms.js         # Buildings + rooms
```

Test credentials (from `CREDENTIALS.md`):

| Role | Email | Password |
| --- | --- | --- |
| CS | `admin@examduty.com` | `Admin123` |
| DCS | `dcs@examduty.com` | `Dcs12345` |
| RS | `rs@examduty.com` | `Rs123456` |
| RS + Invigilator | `invigilator@examduty.com` | `Invig123` |

### Optional: Ngrok

To expose the app externally, run the frontend in production mode (dev server HMR breaks through the tunnel) and expose port 3001:

```bash
cd frontend && npx vite build && npx vite preview --port 3001
ngrok http 3001
```

`NGROK_SETUP_GUIDE.md` has background on the class of problems a single tunnel creates, but it was written against the old Next.js frontend — its ports, config file, and env names are all out of date, so read it for the shape of the fix, not the steps.

## API Reference

All endpoints are prefixed with `/api`. All routes except `POST /auth/register`, `POST /auth/login`, and `POST /users/bootstrap` require a `Bearer <token>` header.

### Auth (`/auth`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/register` | Create a user account. |
| POST | `/login` | Returns `{ user, token, tempToken, requiresRoleSelection }`. Single-role user: `token` is set, `tempToken` null. Multi-role user: `token` is **null**, `tempToken` set, `requiresRoleSelection` true. |
| POST | `/select-role` | Exchange a `tempToken` for a real token bound to the chosen role — returns `{ user, token }`. Mandatory second step for a multi-role user, and the only route that accepts a `tempToken`. 403 if the role isn't in the user's `roles`. |
| GET | `/me` | Current user profile. |

### Users (`/users`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/bootstrap` | Create the first admin — no auth. |
| POST | `/` | Create user. |
| GET | `/` | List users. |
| GET | `/:id` | Get by id. |
| PUT | `/:id` | Update. |
| DELETE | `/:id` | Soft delete. |

### Exams (legacy, `/exams`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/` · GET `/` · GET `/:id` · PUT `/:id` | CRUD. |
| PATCH | `/:id/cancel` · `/:id/restore` | Lifecycle. |

### Exam Groups (`/exam-groups`)
| Method | Path | Description |
| --- | --- | --- |
| POST/GET/PATCH/DELETE | `/` · `/:id` | Group CRUD. |
| GET | `/:id/details` | Group + schedules + rooms. |
| GET | `/:id/duty-status` | Per-room role occupancy flags. |
| POST/GET/DELETE | `/schedules` · `/schedules/:id` | Schedule ops. |
| POST/GET/DELETE | `/rooms` · `/rooms/:id` | Exam room ops. |
| POST | `/room-availability` | Check demand vs capacity. |

### Create Exams (`/create-exams`)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | Module status ping — static `"Create Exams module initialized"`. |
| GET | `/cie/departments-data` | Depts + semesters + courses for a semester. |
| POST | `/cie/calculate-dates` | Auto-calculate dates from shifts. |
| GET | `/cie/rooms` | Available rooms by building. |
| POST | `/cie/plan` | Legacy step 1 — creates the `ExamGroup`, its `ExamSchedule`s, and the per-department plan entries. No rooms. Kept for the seed scripts. |
| POST | `/cie/assign-rooms` | Legacy step 2 — creates the `ExamRoom`s for an already-planned schedule. |
| POST | `/cie/finalize` | One-call: create group + schedules + rooms + DCS groups + sharing config. Replaces the two-step pair above. |
| POST | `/see/plan` | SEE equivalent of `/cie/plan`, for a single department. |
| POST | `/see/finalize` | SEE equivalent of `/cie/finalize`. |

### Duties (`/duties`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/self-assign` | Invigilator self-assign (single room). |
| POST | `/self-assign-group` | RS/DCS self-assign a whole group. |
| POST | `/admin-assign` | CS forces a teacher into a slot. |
| POST | `/admin-assign-group` | Assign a named teacher a whole group — one duty per `examRoom`, transactionally. RS/DCS roles only; anything else is a 400. |
| POST | `/invigilators-for-rooms` | Assigned-invigilator contact list for up to 100 `examRoom` ids. |
| GET | `/` · `/:id` | List / get. |
| PATCH | `/:id/cancel` | Cancel with notification. |

### DCS Groups (`/dcs`)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/groups` · `/groups/mine` · `/groups/:id` | List / mine / by id. |
| GET | `/groups/:id/invigilators` | Contact list for rooms in the group. |
| POST | `/groups/:id/claim` · `/groups/:id/release` | Ownership lifecycle. |
| POST | `/groups/:id/admin-claim` | Claim a group *for* the teacher in `body.teacher` instead of the caller; notifies them. |

### Change Requests (`/change-requests`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/` | Submit — routes internally by `type` (`swap`/`drop`/`move`/`dcs_swap`/`rs_swap`). |
| GET | `/` · `/mine` · `/:id` | List all / mine / by id. |
| GET | `/replacements/:dutyId` | Vacant invigilator slots eligible for a `move`. |
| PATCH | `/:id/approve` · `/:id/reject` | **CS only** (`requireRole("cs")`) — any other active role gets a 403. |

### Departments (`/departments`)
CRUD for `Department`, `Semester` (`/semesters`), `ElectiveGroup` (`/elective-groups`), `Course` (`/courses`). Plus `GET /:id/stats`.

### Infrastructure (`/infrastructure`)
| Method | Path | Description |
| --- | --- | --- |
| POST/GET/DELETE | `/buildings` · `/buildings/:id` | Building ops. |
| GET | `/buildings/:buildingId/rooms` | Rooms in a building. |
| POST | `/rooms` · `/rooms/bulk` | Create single / batch. |
| PATCH/DELETE | `/rooms/:id` | Update / delete. |

### Seat Sharing (`/seat-sharing`)
| Method | Path | Description |
| --- | --- | --- |
| POST | `/available` | Find overlapping shareable rooms for a consumer schedule. |
| POST | `/mark-shareable` · `/unmark-shareable` | Post-hoc toggle. |
| DELETE | `/allocations/:id` | Release an allocation (restores remainingSeats). |
| GET | `/by-exam-room/:examRoomId` · `/by-schedule/:scheduleId` | Read views. |

### Duty Calculation (`/duty-calculation`)

Invigilator workload targets and progress, computed on demand from current DB state — nothing is persisted, so every read recomputes. Eligibility is strictly designation-based: only `Assistant Professor` and `Associate Professor` count (`ELIGIBLE_DESIGNATIONS` in `dutyCalculation.service.js`); every other designation, `Professor` included, is out.

| Method | Path | Description |
| --- | --- | --- |
| GET | `/my-progress` | Caller's own target vs. completed duties — backs the dashboard widget. |
| GET | `/teacher/:teacherId/progress` | The same figures for a named teacher. |
| GET | `/all-teachers` | Cohort table. Filters: `role`, `department`, `eligibleOnly`. |
| GET | `/institution` | Institution-wide totals plus per-department and per-semester breakdown. |
| POST | `/recalculate` | Force-recompute alias — same payload as `/institution`. |
| GET | `/semester/:semesterId` | Semester-level detail (powers the Target tooltip). |
| GET | `/department/:departmentId` | Department-level detail. |

### Notifications (`/notifications`)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/` · `/unread-count` | Read. |
| PATCH | `/read-all` · `/:id/read` | Mark read. |
| DELETE | `/` · `/:id` | Delete all / one. |
| POST | `/broadcast/preview` | **CS.** Resolve role/department filters to a recipient list, with reach per channel (email / WhatsApp / push). No side effects. |
| POST | `/broadcast` | **CS.** Send an in-app notification (and optional email / WhatsApp / push) to the targeted staff. |
| PATCH | `/preferences` | Toggle the caller's own email, WhatsApp and/or push copies. |
| PATCH | `/preferences/email` | Legacy alias for the above. |

### Reminders (`/reminders`)
| Method | Path | Description |
| --- | --- | --- |
| GET | `/my-schedule` | Caller's upcoming duties with the instant each reminder is due. |
| POST | `/run` | **CS.** Trigger the reminder job now. Idempotent — already-sent digests are skipped. |
| GET | `/preview` | **CS.** What a run right now would send, flagged with `alreadySent`. |
| GET | `/health` | **CS.** Scheduler state, SMTP reachability, 7-day email counts. |

### WhatsApp (`/whatsapp`) — all CS-only
| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Provider, connection state, send mode, 7-day message counts. |
| GET | `/qr` | Pending link QR (raw payload + rendered PNG data URL). `webjs` only. |
| GET | `/coverage` | How much of the roster has a usable phone number. |
| GET | `/logs` | Recent sends, numbers masked. |
| POST | `/restart` | Re-initialise the provider after a session drop. |
| POST | `/test` | Send a real test message to one user. |

## Key Design Decisions

- **Modular architecture** — every backend domain is a controller → service → repository → model tuple, with no cross-domain repository calls. Every frontend feature module owns its full slice (components, hooks, services, types).
- **Building-aware conflict detection** — `Duty` carries both a legacy string label (`room`) and a physical room reference (`roomRef`). All conflict queries prefer `roomRef` so the same room number in different buildings can be booked independently. Frontend selection utilities compare via `examRoom.room._id` for the same reason.
- **Per-role slot independence** — one physical room can host all three roles at once (DCS supervisor, RS, invigilator). Conflict scans filter by the caller's role so filling one role's slot never blocks another.
- **Group parity for group roles** — RS and DCS see groups everywhere: Select Duty picks groups, Upcoming Duties shows one card per group, Change Requests swap whole groups, Dashboard aggregates by groups. The same partition key format (`scheduleId:buildingId:chunkIndex` for RS, persistent `DCSGroup._id` for DCS) is used across all four surfaces so a group looks identical wherever it appears.
- **Transactional group operations** — RS/DCS claim and group swap approvals use `withOptionalTransaction` so a partial write is impossible on replica-set deployments (and cleanly re-runnable on standalone Mongo).
- **Soft deletes with pre-hooks** — `Exam` and `User` are soft-deleted; Mongoose pre-hooks exclude them from find queries automatically.
- **Notification decoupling** — a central emitter pattern (`notification.emitter.js`) with typed templates lets any service emit without knowing about the notification schema.
- **Client-derived RS groups** — RS groups exist only as computed views over the same `AvailableDutySlot` list Select Duty consumes. This keeps the source of truth in one place; group swap requests snapshot the concrete IDs at submit time so the approval always has a stable target.

## Recent Enhancements

- **DCS supervision module** — persistent `DCSGroup` collection with per-schedule sizing (`ceil(students / 300)`), deterministic room distribution, claim/release lifecycle, per-group invigilator contact lookup, and `dcs_swap` change-request type. Generation is wired into `finalizeCIEPlan` / `finalizeSEEPlan`; a `backfill-dcs-groups.js` script backfills legacy `ExamGroup`s.
- **Building-aware conflict detection** across the entire duty stack (model, repository, service, `examGroup.getDutyStatus`, `changeRequest.isInvigilatorAlreadyAssigned`, invigilator frontend selection utilities).
- **RS group-based UI parity** — Upcoming Duties, Change Requests, and Dashboard now all render one card per RS group instead of per room. Backend gained `rs_group` scope and `rs_swap` type on `ChangeRequest` with atomic approval, and `Duty` gained an indexed `roomRef` field for building-scoped queries.
- **Elective seeding** — every `(department, semester)` pair has at least one professional-elective and one open-elective course, attached to `ElectiveGroup`s so the Departments UI renders them.

## Contributing

Follow the existing patterns:
- Add a new backend feature under `backend/modules/<domain>/` with `.controller.js`, `.service.js`, `.repository.js`, `.model.js`, `.routes.js`.
- Mount the route in `backend/app.js`.
- Add a matching frontend module under `frontend/src/modules/<domain>/` with `pages/`, `components/`, `hooks/`, `services/`, `types.ts`.
- Cross-role behavior goes under `frontend/src/modules/shared/`.
- Prefer using `roomRef` (ObjectId) over `room` (string) for any building-sensitive query.
- Emit notifications for user-visible state changes via `notification.emitter.js`.
