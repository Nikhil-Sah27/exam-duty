# Exam Duty — Webapp User Flow

End-user walkthrough, screen by screen, with where each click goes.

## 1. You open the app → bounced to login

You hit `http://localhost:3001`. `main.tsx` mounts the React tree. The router lands on `/` (Dashboard), but `ProtectedLayout` wraps it in `AuthGuard`. `AuthGuard` runs `useAuthStore.hydrate()` which reads `localStorage["token"]`:

- **No token** → `navigate("/login", { replace: true })` (`AuthGuard.tsx:27-31`). You never see the Dashboard.
- **Token exists** → it fires `useMe()` (GET `/api/auth/me`), repopulates the `user` object, and renders the protected layout.

## 2. Login screen

`LoginForm.tsx` — centered card with email + password + "Sign In" button. Submit calls `useLogin()` (`auth/hooks/index.ts:7`):

```
POST /api/auth/login  { email, password }
  → backend auth.service.js:39 → bcrypt.compare → jwt.sign({ id }, JWT_SECRET, 7d)
  → returns { user, token }
  → setAuth(user, token)  // stores token in localStorage, user in Zustand
  → navigate("/")
```

Bad credentials → backend throws `AppError("Invalid email or password", 401)` → errorHandler renders `{ success:false, message }` → axios interceptor flattens it to `Error.message` → `<ErrorAlert>` shows it above the form.

## 3. After login: the shell

`ProtectedLayout` renders three things:

- **Navbar** at the top (fixed, 64px tall)
- **Sidebar** on the left (240px wide when open), driven by `navigation.ts`. Right now you see all 10 items regardless of role (no `roles` filter set):
  1. Dashboard
  2. Create Exams
  3. Exams
  4. Change Requests
  5. Manage Duties
  6. Teachers
  7. Departments
  8. Rooms & Buildings
  9. Reports
  10. Audit Log
- **Main** (`<Outlet/>`) — the page you're on.

## 4. Dashboard (`/`)

Currently a placeholder — `DashboardPage.tsx` just renders "Welcome, {user.name} to Exam Duty Management System." That's it. No widgets, no counts. (Could be the next thing to build out.)

## 5. Create Exams flow (`/create-exams`)

This is the heavy workflow. Two top-level cards: **CIE** (internal — IA1/IA2/IA3) and **SEE** (semester-end). SEE is still a placeholder (`SEEWorkflowPlaceholder.tsx`); only CIE is wired up. Picking CIE mounts `CIEPage.tsx`, which is a 4-step wizard driven by `<Stepper>`:

### Step 0 — Configuration (`ConfigStep.tsx`)

You set:

- **Departments** — multi-select (toggled via `DepartmentSelector`, fetched from `/api/departments`).
- **Semester** — 1–8 dropdown.
- **Exam Type** — IA-1 / IA-2 / IA-3.
- **Avg Students per Class** — number, used later for room sizing.
- **Shifts** — list of `{name, startTime, endTime}` (e.g., Morning 09:00–10:30; you can add multiple).
- **Start Date** + either click **Auto-calculate** (calls `POST /api/create-exams/cie/calculate-dates` — server picks the required # of days, skipping Sundays — see `cie.utils.js` + `cie.service.js:60-92`) or type the end date manually.

The moment departments + semester are both set, `useDepartmentsData` (`GET /api/create-exams/cie/departments-data`) auto-fetches each department's course list for that semester — those courses populate the dropdowns in the next step. `StatsBar` shows totals reactively (# courses, # students, etc.). Continue is disabled until the config is valid.

### Step 1 — Routine Builder (`RoutineStep.tsx`)

A grid: one row per `(date × shift)` slot, columns are the selected departments. Each cell is a `<select>` of that department's courses. The hook (`useExamCreation.ts`) pre-generates the routine entries; you pick one course per (slot, dept) cell. Already-used courses for that department appear as `(used)` and are disabled, so you can't schedule the same paper twice.

Back/Continue at the bottom.

### Step 2 — Summary (`SummaryStep.tsx`)

A read-only review: 4 stat cards (Total Exams, Exam Days, Departments, Shifts/Day), config recap, list of dates as chips, the full routine table, and any validation warnings (`exam.routineWarnings`).

Clicking **Create Plan & Assign Rooms** fires `useCreateCIEPlan()`:

```
POST /api/create-exams/cie/plan  { examType, semester, startDate, endDate, shifts, routine }
  → backend cie.service.js:123 createPlan:
     - validates dates (no past, end >= start)
     - checks for overlapping ExamGroup of same type+semester (409 if found)
     - creates ExamGroup
     - for each unique (date, shift) builds one ExamSchedule
     - for each (slot, dept, courseId) creates a CIEPlanEntry
     - returns { ...examGroup, scheduleMapping: { "date|shiftIdx": scheduleId } }
```

Frontend stashes the `scheduleMapping` and uses the real schedule IDs to seed `slotAllocations` for the next step.

### Step 3 — Room Assignment (`RoomAssignStep.tsx`)

Fetches buildings/rooms via `useCIERooms` (`GET /api/create-exams/cie/rooms` → grouped by building → floor). For each schedule slot you see a `SlotCard` per department: pick rooms from the room selector. The UI tracks:

- **Primary assignments** — that room is fully owned by that department for that slot.
- **Shared seats** — one room split across departments (the `Share2` icon, `isShared: true`); the global stats bar shows total shared seats.

A global progress bar shows `capacity / students` coverage and `depts covered` so you know when you're done.

Clicking **Assign Rooms & Finish** fires `useAssignCIERooms()`:

```
POST /api/create-exams/cie/assign-rooms  { assignments: [{scheduleId, roomId, departmentCode, students?, isShared?}, ...] }
  → cie.service.js:213 assignRooms:
     - rejects duplicate (schedule, room, dept) primary assignments
     - groups ALL (primary + shared) by schedule+room
     - creates one ExamRoom per group, with departments[] merged
        (this group-then-insert is the fix from commit 7121bbf — without it, the
         unique index on schedule+room throws 400 when two depts share a room)
```

On success the page swaps to a green checkmark summary with **View Exams** (→ `/exams`) and **Create Another** (resets the wizard).

## 6. Exams (`/exams`)

`ExamsPage.tsx` — grid of `ExamGroup` cards from `useExamGroups()` (`GET /api/exam-groups`). Filters by exam type and semester (client-side). Two CRUD entry points:

- **New Exam Group** (top-right `Plus` button) → `CreateExamModal` for ad-hoc creation outside the wizard.
- **Delete** on a card → `ConfirmDeleteModal` → `useDeleteExamGroup()` (DELETE — *cascades* the schedules/room assignments per the warning copy).
- Click a card → `/exams/:id` (`ExamDetails.tsx`) which shows the timetable and per-room/duty status. The exams components folder includes `Timetable`, `TimetableDay`, `AddRoomModal`, `AddScheduleModal`, `DutyStatusModal`, `EditExamModal` — that's the per-group editing surface.

## 7. The rest of the sidebar (briefly)

- **Manage Duties** → list of teachers; drill into one to see their duties / cancel / etc. Backed by `/api/duties`. Self-assign and admin-assign both run through `duty.service.js`'s conflict checker + MongoDB transaction.
- **Change Requests** → faculty submitting swap/drop requests; admin approves/rejects. Backend is wired (`change-request` module), frontend module exists.
- **Teachers / Departments / Rooms & Buildings** → standard CRUD over `/api/users`, `/api/departments`, `/api/infrastructure`.
- **Reports / Audit Log** → read-only views over `/api/reports` and `/api/audit`.

## TL;DR of one full path

```
Open localhost:3001
  → AuthGuard → no token → /login
  → submit creds → POST /api/auth/login → token in localStorage
  → navigate /  (Dashboard placeholder)
  → click "Create Exams" in Sidebar → /create-exams
  → pick CIE
    Step 0: pick depts + sem + exam type + shifts + auto-calc dates
    Step 1: fill course per (date,shift,dept) cell
    Step 2: review → POST /api/create-exams/cie/plan
            (creates ExamGroup + ExamSchedules + CIEPlanEntries)
    Step 3: assign rooms per slot/dept (with sharing)
            → POST /api/create-exams/cie/assign-rooms
            (creates ExamRoom docs grouped by schedule+room)
  → success screen → "View Exams" → /exams → see the new group
```

Everywhere along the way, errors thrown server-side (`AppError`) become `{success:false, message}` JSON, the axios interceptor turns that into `new Error(message)`, the TanStack mutation exposes it on `mutation.error`, and components render it via `<ErrorAlert>` or inline red banners. Any 401 (token expired/invalid) logs you out automatically and you're back at `/login`.

---

## Appendix — Stack & architecture (background context)

### Stack (actual, not what the README says)

| Layer | What's there |
|---|---|
| Frontend | **Vite 6 + React 19 + React Router 7** (README says Next.js — wrong) |
| State | Zustand (auth/UI) + TanStack Query (server cache) |
| Forms | react-hook-form + zod |
| Backend | Express 4 (CommonJS) on Node, JWT auth, bcrypt |
| DB | MongoDB via Mongoose 8, with transactions for critical writes |
| Dev wiring | Vite dev server on `:3001` proxies `/api/*` → `http://localhost:5000` |

Root `package.json` uses `concurrently` to boot both halves: `npm run dev` → backend (`nodemon server.js`) + frontend (`vite`).

### Backend module shape

Every module under `backend/modules/<name>/` follows the same pattern:

```
auth.routes.js       → wires URLs to controller, mounts protect middleware
auth.controller.js   → thin: pulls req.body/req.user, calls service, returns JSON
auth.service.js      → all business rules, validation, transactions
auth.repository.js   → only place Mongoose model is touched
auth.model.js        → Mongoose schema + indexes + pre-hooks
```

Modules actually present (12, README only documents 6):

```
auth · user · exam · examGroup/examSchedule/examRoom · duty
change-request · notification · department · infrastructure
report · audit · create-exams (CIE planner)
```

### Notable backend mechanics

- **Soft delete via Mongoose pre-hook.** `exam.model.js:53-57` registers `pre(/^find/)` that silently injects `{ isCancelled: false }` into every query unless the caller explicitly opts in (`?cancelled=true`). Users have the same pattern via `isActive`.
- **Conflict detection for duties.** `duty.service.js:10-30` runs two queries before any insert: one for a same-teacher overlap and one for a same-room overlap on that date+timeslot. Backed by compound indexes `{teacher,date,startTime,status}` and `{room,date,startTime,status}` (`duty.model.js:62-63`).
- **MongoDB transactions on duty assignment.** `duty.service.js:61-89` opens a session, inserts under the session, commits, then *outside* the txn populates and emits the notification. Notifications are intentionally not part of the txn — a notification failure won't roll back the duty.
- **Notification emitter pattern.** `notification.emitter.js` is the only public surface; other modules `require` only it. `notification.templates.js` maps an event type (`duty_assigned`, `duty_cancelled`, `request_approved`, …) to `{title, message}`. Adding a new notification type = one templates entry, no plumbing.
- **CIE planner.** `create-exams/cie.service.js` is the heavy custom workflow: pick departments + semester → fetch courses → auto-calculate dates (skipping Sundays) → build `ExamGroup` + `ExamSchedule`s + `CIEPlanEntry`s → then `assignRooms` collapses duplicates into `ExamRoom` docs grouped by `schedule+room` (the bug-fix from commit `7121bbf`).

### Frontend module shape

Mirrors the backend, one folder per domain:

```
src/modules/<name>/
  components/   pages built from primitives in shared/components
  hooks/        TanStack Query hooks (useExams, useExam, useCreateExam, ...)
  services/     wraps shared/lib/api.ts → typed responses
  types.ts      domain types
```

Routes in `App.tsx` are flat (no Next.js file-based routing) — every protected page sits inside one `<Route element={<ProtectedLayout/>}>`. The sidebar comes from a single `navItems` array in `shared/lib/navigation.ts` filtered by role (`getVisibleNavItems`) — though right now none of the items declare a `roles` array, so they all show.

`shared/store/auth.store.ts` is the only piece of client state that needs to survive a refresh; it persists just the JWT to `localStorage` (not the user object — that gets re-fetched via `/api/auth/me`).

### Things worth flagging

- **README is stale.** Says Next.js 16, mentions `next.config.ts` rewrites and `app/(protected)/` route groups — none of that exists. It's Vite + React Router. Frontend port is `3001`, not `3000`. Modules listed in the README are a subset of what actually exists.
- **`getVisibleNavItems` is currently a no-op filter** because no nav item has `roles` set. If you wanted CS/faculty/invigilator views to differ, you'd add `roles: [...]` to each item.
- **Token in localStorage** is fine for this app's threat model but means any XSS reads the JWT. There's no refresh-token flow — a single 7-day JWT, hard logout on 401.
