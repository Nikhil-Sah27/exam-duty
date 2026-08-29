# Exam Duty — Test Credentials

## Setup (Required)

Before logging in, you **must** run the seed script to create the default users in your local database:

```bash
cd backend
node scripts/seed-users.js
```

> The script is safe to run multiple times — it skips users that already exist.

## Default Logins

| Role | Name | Email | Password |
|------|------|-------|----------|
| **CS (Controller of Superintendents)** | Admin | admin@examduty.com | Admin123 |
| **DCS (Deputy Controller of Superintendents)** | Deputy Admin | dcs@examduty.com | Dcs12345 |
| **RS (Room Superintendent)** | Resource Scheduler | rs@examduty.com | Rs123456 |
| **RS + Invigilator** | Invigilator One | invigilator@examduty.com | Invig123 |

### Role Descriptions

See the [root README](README.md#roles) for the full model; in short:

- **CS** — Controller of Superintendents. Full admin: users, exams, departments, rooms, direct duty assignment, and the only role that can approve or reject change requests.
- **DCS** — Deputy Controller of Superintendents. Claims a student-count-sized supervision *group* and oversees every room in it.
- **RS** — Room Superintendent. Claims a *group* of up to 5 rooms in one building for a shift.
- **Invigilator** — Self-assigns or is assigned a single room per slot; views duties and raises change requests.

A user may hold more than one of these roles — `User.roles` is an array, and roles follow from designation (`backend/shared/utils/roleResolver.js`). The last seeded account is the multi-role case: `invigilator@examduty.com` is an Assistant Professor and so holds `["rs", "invigilator"]`. Logging in as it returns a `tempToken` rather than a token, and you must pick a role at `POST /auth/select-role` (the `/select-role` screen) before any protected route will accept you.

## Notes

- All passwords are hashed with bcrypt before storing in the database.
- These are **test credentials only** — change them in production.
