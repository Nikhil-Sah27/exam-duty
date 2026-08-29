# Exam Duty — Frontend

Vite + React 19 + TypeScript + Tailwind 4 client for the Exam Duty system. See the [root README](../README.md) for the full product overview.

## Stack

- **Build:** Vite 6
- **UI:** React 19 · Tailwind CSS 4 · Lucide icons
- **State:** Zustand (client) · TanStack React Query (server cache)
- **Routing:** React Router 7
- **Forms:** React Hook Form · Zod

## Scripts

```bash
npm run dev       # Vite dev server on :5173, HMR enabled
npm run build     # tsc -b && vite build
npm run preview   # Serve the production build
npm run lint      # ESLint
```

The dev and preview servers proxy `/api/*` to the backend at `http://localhost:5001` by default (`:5000` is held by ControlCenter on macOS). No `.env` is required for the default setup; if the backend runs elsewhere, copy `.env.example` to `.env.local` and set `DEV_API_PROXY_TARGET`. That variable only steers the Vite server's proxy — to point a built app at a backend on another origin, set `VITE_API_URL` instead (it becomes the axios `baseURL`; see `.env.example`).

## Layout

```
src/
├── App.tsx                  # Router root — public /login + /select-role, protected admin + role trees
├── main.tsx                 # Vite entry, QueryClient provider
├── modules/
│   ├── auth/                # Login form + hooks
│   ├── dashboard/           # Admin dashboard
│   ├── create-exams/        # CIE + SEE wizard (config → routine → rooms → sharing)
│   ├── exams/               # List / filter / timetable
│   ├── manage-duties/       # Per-teacher admin
│   ├── users/               # Teacher CRUD
│   ├── departments/         # Dept + semester + course + electives
│   ├── infrastructure/      # Buildings + rooms
│   ├── change-requests/     # Admin review + approve/reject
│   ├── notifications/       # Bell + list
│   ├── duties/              # Shared types + admin duty ops
│   ├── invigilator/         # /invigilator/*  (single-room grain)
│   ├── rs/                  # /rs/*           (group grain — chunks of ≤5 rooms)
│   ├── dcs/                 # /dcs/*          (group grain — student-count sized)
│   └── shared/
│       ├── change-requests/ # ChangeRequestCard + types + hooks
│       ├── exams/           # useSharedExamData, selectors, RoomDutyFlags
│       ├── dashboard/       # Hero + section + role-agnostic normalizers
│       └── role-config/     # Nav items + default path + role flag key
└── shared/
    ├── components/          # AuthGuard, Sidebar, ProtectedLayout, Navbar
    ├── store/               # Zustand auth + app stores
    └── lib/                 # Axios API client, User type, navigation config
```

## Role Trees

Each role has its own routed subtree under `modules/<role>/routes/*Routes.tsx`.

| Role | Base | Grain | Notes |
| --- | --- | --- | --- |
| Invigilator | `/invigilator` | Single room | Select Duty grid, Upcoming Duties per-room cards. |
| RS | `/rs` | Group of ≤5 rooms (per schedule + building) | Every screen is grouped: Dashboard, Select Duty, Upcoming Duties, Change Requests. |
| DCS | `/dcs` | Persisted `DCSGroup` (sized by student count) | Same group parity as RS; upcoming cards show the invigilator contact for each room. |
| CS | `/` (admin shell) | System-wide | Create Exams, Users, Departments, Infrastructure, Change Requests review. |

## Auth Flow

`ProtectedLayout` (`shared/components/ProtectedLayout.tsx`) wraps every protected route in `AuthGuard`. `AuthGuard` reads the persisted token from `localStorage`, hydrates the Zustand `useAuthStore`, and either redirects to `/login` or fetches `/api/auth/me` to hydrate the user profile. The admin shell then checks `getRoleConfig(user?.activeRole)` — for an operational active role (`invigilator`/`rs`/`dcs`) it redirects to that role's `defaultPath` (`/<role>/dashboard`) before any admin UI renders; CS has no role config and stays in the shell.

`activeRole` is the single role the current token is bound to, not the user's full set: `User.roles` is an array, and a user holding more than one logs in with a `tempToken` and must choose at `/select-role` (`RoleSelectionPage`), which exchanges it for a role-bound token. `useAuthStore` keeps `token` and `tempToken` separate; the axios interceptor prefers `token` and falls back to `tempToken`.

## Key Utilities

- `shared/dashboard/utils/dashboardNormalizers.ts` — pure functions that turn each role's server shape into the shared `DashboardDutyItem`. RS and DCS use group-based normalizers so cards always represent groups.
- `rs/upcoming-duties/utils/rsUpcomingGrouping.ts` — canonical RS grouping algorithm (partition by `examGroup | schedule | date | time | building`, chunk by 5, deterministic `groupId = scheduleId:buildingId:chunkIndex`). Reused by Upcoming Duties, Change Requests, and Dashboard.
- `invigilator/duties/utils/dutySelectionUtils.ts` — building-aware duty match. `dutyMatchesSlot` compares `duty.examRoom.room._id` before falling back to the room string, so `Academic Block 004` never shadows `Lab Block 004`.
- `shared/exams/utils/examStatusUtils.ts` — mirror helpers for the shared exam views.
- `shared/change-requests/components/ChangeRequestCard.tsx` — renders all three scopes (`duty`, `dcs_group`, `rs_group`) with source→target group blocks.

## Testing UI Changes

For any UI change, start the dev server (`npm run dev`), log in as the relevant role (see `../CREDENTIALS.md`), and click through the golden path plus edge cases. Type checks (`tsc -b --noEmit`) verify code correctness, not feature correctness — verify visually in the browser.
