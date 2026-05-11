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
| **CS (Super Admin)** | Admin | admin@examduty.com | Admin123 |
| **DCS (Deputy Admin)** | Deputy Admin | dcs@examduty.com | Dcs12345 |
| **RS (Resource Scheduler)** | Resource Scheduler | rs@examduty.com | Rs123456 |
| **Invigilator** | Invigilator One | invigilator@examduty.com | Invig123 |

### Role Descriptions

- **CS** — Core System admin. Full access to everything (users, exams, duties, infrastructure).
- **DCS** — Deputy Core System. Assists admin with management tasks.
- **RS** — Resource Scheduler. Manages room/resource allocation and scheduling.
- **Invigilator** — Views assigned duties, can raise change requests.

## Notes

- All passwords are hashed with bcrypt before storing in the database.
- These are **test credentials only** — change them in production.
