# Exam Duty

A full-stack web application for managing exam invigilator duty assignments in academic institutions. Administrators can create exams, assign invigilator duties to faculty, and faculty can self-assign duties, request swaps, or request to drop duties — all with real-time notifications.

## Tech Stack

| Layer     | Technology                                              |
| --------- | ------------------------------------------------------- |
| Frontend  | Next.js 16, React 19, TypeScript, Tailwind CSS 4        |
| State     | Zustand, TanStack React Query                           |
| Backend   | Node.js, Express 4                                      |
| Database  | MongoDB (Mongoose ODM)                                  |
| Auth      | JWT (bcrypt password hashing)                           |

## Features

- **Exam Management** — Create, edit, cancel, and restore exams with filters by department, semester, type, and status. Exams track lifecycle via status (`upcoming` | `ongoing` | `completed`).
- **Duty Assignment** — Admin-assign or self-assign invigilator duties with automatic conflict detection (teacher time slots & room overlaps). Tracks self-assignment vs admin-assignment and optional cancel reasons.
- **Change Requests** — Faculty can submit swap or drop requests; admins approve/reject with full transaction support. *(Backend API fully implemented; frontend UI is planned.)*
- **Notifications** — In-app notifications with a centralized template system supporting `duty_assigned`, `duty_cancelled`, `request_submitted`, `request_approved`, `request_rejected`, and `duty_swapped` event types.
- **User Management** — Role-based users (admin, faculty, invigilator, cs) with soft-delete support.
- **Auth** — JWT-based authentication with protected routes, automatic token refresh via Axios interceptors, and auto-logout on 401 responses.

## Project Structure

```
exam-duty/
├── backend/
│   ├── server.js                  # Entry point — connects DB, starts server
│   ├── app.js                     # Express app setup, CORS, route mounting
│   ├── modules/
│   │   ├── auth/                  # Register, login, JWT generation
│   │   ├── user/                  # User CRUD, bootstrap admin
│   │   ├── exam/                  # Exam CRUD, cancel/restore, status lifecycle
│   │   ├── duty/                  # Self-assign, admin-assign, conflict checks
│   │   ├── change-request/        # Swap/drop requests, approve/reject
│   │   └── notification/          # Emit, list, mark-read, template system
│   └── shared/
│       ├── config/db.js           # MongoDB connection
│       ├── middleware/             # Auth (JWT) & error handler
│       └── utils/                 # AppError, catchAsync
│
├── frontend/
│   ├── next.config.ts             # Rewrites /api/* → backend for proxying
│   └── src/
│       ├── app/
│       │   ├── login/             # Login page
│       │   └── (protected)/       # Auth-guarded routes (via AuthGuard)
│       │       ├── page.tsx       # Dashboard
│       │       ├── exams/         # Exams management
│       │       ├── duties/        # Duties management
│       │       └── users/         # Users management
│       ├── modules/               # Feature modules (components, hooks, services, types)
│       │   ├── auth/
│       │   ├── exams/
│       │   ├── duties/
│       │   ├── users/
│       │   ├── dashboard/
│       │   └── notifications/
│       └── shared/
│           ├── components/        # AuthGuard, StatusBadge, ErrorAlert, Sidebar
│           ├── lib/               # API client (Axios), utilities, providers
│           └── store/             # Zustand stores (auth, app state)
```

Each backend module follows a **controller → service → repository** pattern with dedicated model and route files. Each frontend module mirrors this with **components, hooks, services, and types**.

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (running locally or a connection URI)

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd exam-duty
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   ```

   Create a `.env` file:

   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/exam-duty
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret_here
   JWT_EXPIRES_IN=7d
   ```

3. **Frontend**

   ```bash
   cd frontend
   npm install
   ```

   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=/api
   ```

   > If omitted, the API client falls back to `http://localhost:5000/api`.

### Running Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5000](http://localhost:5000)

### First-Time Setup

Bootstrap the first admin user by calling:

```bash
curl -X POST http://localhost:5000/api/users/bootstrap
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint    | Description           | Auth |
| ------ | ----------- | --------------------- | ---- |
| POST   | `/register` | Register a new user   | No   |
| POST   | `/login`    | Login, returns JWT    | No   |
| GET    | `/me`       | Get current user      | Yes  |

### Users (`/api/users`)
| Method | Endpoint     | Description              | Auth |
| ------ | ------------ | ------------------------ | ---- |
| POST   | `/bootstrap` | Create first admin       | No   |
| POST   | `/`          | Create user              | Yes  |
| GET    | `/`          | List all users           | Yes  |
| GET    | `/:id`       | Get user by ID           | Yes  |
| PUT    | `/:id`       | Update user              | Yes  |
| DELETE | `/:id`       | Soft-delete user         | Yes  |

### Exams (`/api/exams`)
| Method | Endpoint       | Description           | Auth |
| ------ | -------------- | --------------------- | ---- |
| POST   | `/`            | Create exam           | Yes  |
| GET    | `/`            | List exams (filterable) | Yes |
| GET    | `/:id`         | Get exam by ID        | Yes  |
| PUT    | `/:id`         | Update exam           | Yes  |
| PATCH  | `/:id/cancel`  | Cancel exam           | Yes  |
| PATCH  | `/:id/restore` | Restore cancelled exam | Yes |

### Duties (`/api/duties`)
| Method | Endpoint          | Description              | Auth |
| ------ | ----------------- | ------------------------ | ---- |
| POST   | `/self-assign`    | Self-assign a duty       | Yes  |
| POST   | `/admin-assign`   | Admin assigns duty       | Yes  |
| GET    | `/`               | List duties (filterable) | Yes  |
| GET    | `/:id`            | Get duty by ID           | Yes  |
| PATCH  | `/:id/cancel`     | Cancel duty              | Yes  |

### Change Requests (`/api/change-requests`)
| Method | Endpoint       | Description             | Auth |
| ------ | -------------- | ----------------------- | ---- |
| POST   | `/`            | Submit swap/drop request | Yes |
| GET    | `/`            | List all requests       | Yes  |
| GET    | `/mine`        | List my requests        | Yes  |
| GET    | `/:id`         | Get request by ID       | Yes  |
| PATCH  | `/:id/approve` | Approve request         | Yes  |
| PATCH  | `/:id/reject`  | Reject request          | Yes  |

### Notifications (`/api/notifications`)
| Method | Endpoint        | Description               | Auth |
| ------ | --------------- | ------------------------- | ---- |
| GET    | `/`             | Get my notifications      | Yes  |
| GET    | `/unread-count` | Get unread count          | Yes  |
| PATCH  | `/read-all`     | Mark all as read          | Yes  |
| PATCH  | `/:id/read`     | Mark one as read          | Yes  |

## Database Models

- **User** — name, email, password, phone (optional), role (`admin` | `faculty` | `invigilator` | `cs`), department, designation, soft-delete via `isActive`
- **Exam** — name, date, department, semester (1–8), type (`internal` | `external` | `supplementary` | `arrear`), status (`upcoming` | `ongoing` | `completed`), soft-delete via `isCancelled`
- **Duty** — exam, teacher, room, date, time range, assignedBy, isSelfAssigned, cancelReason, status — indexed for conflict detection
- **ChangeRequest** — duty, requestedBy, type (`swap` | `drop`), reason, review status — unique constraint prevents duplicate pending requests
- **Notification** — recipient, type, title, message, refModel (`Duty` | `ChangeRequest`), refId, readAt — indexed for efficient per-user queries

## Key Design Decisions

- **Modular architecture** — Each domain (auth, exam, duty, etc.) is a self-contained module with its own model, controller, service, repository, and routes.
- **Transaction support** — Critical operations (duty assignment, change request approval) use MongoDB transactions to ensure data consistency.
- **Conflict detection** — Duty assignment validates against teacher time-slot and room-overlap conflicts using compound indexes.
- **Soft deletes** — Exams and users are soft-deleted with Mongoose pre-hooks that automatically exclude deleted records from queries.
- **Notification system** — Decoupled emitter pattern (`notification.emitter.js`) with a centralized template system (`notification.templates.js`) allows any module to emit typed notifications without tight coupling.
- **API proxying** — Next.js rewrites proxy `/api/*` requests to the Express backend, enabling single-tunnel external access via ngrok.

## Ngrok Tunneling (Optional)

To expose the app externally (must use production build — dev server HMR breaks through ngrok):

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend (production build)
cd frontend && npx next build && npx next start --port 3001

# Terminal 3 — Ngrok
ngrok http 3001
```

The Next.js config rewrites `/api/*` requests to the backend, and CORS is pre-configured to allow `*.ngrok-free.app` domains.

For detailed troubleshooting (CORS, HMR, EADDRINUSE, blank pages, etc.), see [NGROK_SETUP_GUIDE.md](NGROK_SETUP_GUIDE.md).
