# Exam Duty - API Test Suite

Comprehensive API tests for all backend modules.

## Setup

```bash
cd tests
npm install
```

## Run Tests

```bash
# Run ALL tests (against localhost:5000)
npm test

# Run against a remote server (ngrok, deployed, etc.)
API_URL=https://your-server.app/api npm test

# Run individual test suites
npm run test:auth
npm run test:users
npm run test:departments
npm run test:infrastructure
npm run test:exams
npm run test:exam-groups
npm run test:duties
npm run test:change-requests
npm run test:notifications
npm run test:create-exams
```

## Prerequisites

1. **MongoDB** must be running
2. **Backend server** must be running (`npm run dev` from backend folder)
3. **Bootstrap admin** - the test suite will auto-bootstrap if needed
   - Default admin: `admin@examduty.com` / `admin123`
   - Change in `config.js` if different

## Test Coverage

| Suite | Module | Tests |
|-------|--------|-------|
| 01 | Auth | Register, login, token validation, error cases |
| 02 | Users | CRUD, filtering, soft delete |
| 03 | Departments | Dept + semester + course CRUD, stats |
| 04 | Infrastructure | Buildings + rooms, bulk create, capacity |
| 05 | Exams | CRUD, cancel/restore, filtering |
| 06 | Exam Groups | Groups + schedules + rooms, duty status |
| 07 | Duties | Self-assign, admin-assign, conflicts, cancel |
| 08 | Change Requests | Drop/swap requests, approve/reject workflow |
| 09 | Notifications | List, unread count, mark read |
| 10 | Create Exams | CIE workflow: dept data, dates, plan, rooms |

## Configuration

Edit `config.js` to change:
- `BASE_URL` - API server URL
- `ADMIN_EMAIL` - Admin login email
- `ADMIN_PASSWORD` - Admin login password
