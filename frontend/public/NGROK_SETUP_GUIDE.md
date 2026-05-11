# Ngrok Setup Guide for Next.js + Express Projects

## The Problem
We have a **Next.js frontend** (port 3001) and an **Express backend** (port 5000) running locally. We want to expose the full app to the internet using **ngrok** with a single tunnel (`ngrok http 3001`).

---

## Bug #1: Backend API Not Reachable Through Ngrok

### What happened
- Ngrok only tunnels to **one port** (3001 — the frontend).
- The frontend was calling the backend directly at `http://localhost:5000/api`.
- Anyone accessing via ngrok can't reach `localhost:5000` — it's YOUR machine, not theirs.

### Fix: Proxy API requests through Next.js

**Step 1 — Add rewrites in `next.config.ts`:**
```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:5000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```
This makes Next.js proxy any `/api/*` request to the Express backend. So ngrok → Next.js → Express, all through one tunnel.

**Step 2 — Change `frontend/.env.local`:**
```
# BEFORE (absolute URL — won't work through ngrok)
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# AFTER (relative URL — works with any domain)
NEXT_PUBLIC_API_URL=/api
```
Using `/api` (relative) means the browser sends API requests to whatever domain it's on — `localhost:3001` locally, or `xyz.ngrok-free.dev` through ngrok.

---

## Bug #2: CORS Blocking Ngrok Requests

### What happened
- Backend CORS only allowed `http://localhost:3000` and `http://localhost:3001`.
- Requests from `https://xyz.ngrok-free.dev` were blocked.

### Fix: Allow ngrok origins dynamically in `backend/app.js`

```js
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    // Allow localhost origins
    // Allow any ngrok subdomain
    if (!origin || allowedOrigins.includes(origin) || /\.ngrok-free\.app$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
```

---

## Bug #3: Port Already in Use (EADDRINUSE)

### What happened
- Backend crashed with `Error: listen EADDRINUSE: address already in use :::5000`
- A previous instance of the backend was still running on port 5000.

### Fix: Kill the old process, then restart

```bash
# On Windows (PowerShell)
Get-NetTCPConnection -LocalPort 5000 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Then restart
cd backend && npm run dev
```

**Lesson:** Always check if a port is free before starting a server. If it crashes with EADDRINUSE, kill the old process first.

---

## Bug #4: Ngrok Shows "Endpoint Offline" (ERR_NGROK_3200)

### What happened
- Ngrok free tier creates an **HTTP** tunnel (not HTTPS).
- The browser auto-upgrades to `https://` when you type the URL.
- HTTPS hits ngrok but there's no HTTPS tunnel → "offline" error.

### Fix: Use the correct protocol

**Option A:** Explicitly use `http://` in the browser:
```
http://moaning-underling-prelude.ngrok-free.dev
```

**Option B:** Ngrok actually DOES create both HTTP and HTTPS tunnels (confirmed in our case). If HTTPS shows offline, restart ngrok:
```bash
# Stop ngrok (Ctrl+C), then restart
ngrok http 3001
```

**How to verify tunnels are working:**
```bash
# Check ngrok's local API for tunnel info
curl http://localhost:4040/api/tunnels

# Test HTTP
curl http://YOUR-SUBDOMAIN.ngrok-free.dev

# Test HTTPS
curl https://YOUR-SUBDOMAIN.ngrok-free.dev
```

---

## Bug #5: Blank White Page Through Ngrok (WebSocket HMR Failure)

### What happened
- The page HTML loaded (title showed "Exam Duty") but the screen was blank.
- Console showed repeated WebSocket errors:
  ```
  WebSocket connection to 'wss://xyz.ngrok-free.dev/_next/webpack-hmr' failed
  ```
- Next.js **dev server** uses WebSockets for Hot Module Replacement (HMR).
- The constant WebSocket reconnection attempts were interfering with React's client-side hydration.
- The `AuthGuard` component returns `null` (blank) until React hydrates and checks auth — but hydration was failing silently.

### Fix: Use production build instead of dev server

The dev server's HMR is unnecessary for external access and breaks through ngrok. Build and run in production mode:

```bash
# Build the frontend
cd frontend
npx next build

# Kill the dev server
# Windows PowerShell:
Get-NetTCPConnection -LocalPort 3001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Start production server
npx next start --port 3001
```

**Why this works:**
- Production mode has NO WebSocket/HMR connections.
- React hydrates cleanly without interference.
- Pages load faster (pre-built, optimized).
- The AuthGuard properly hydrates → checks token → redirects to `/login`.

---

## Bug #6: AuthGuard Redirect Not Working

### What happened
- `AuthGuard` used Next.js client-side router (`router.replace("/login")`) for redirects.
- Through ngrok, the client-side router can be unreliable.

### Fix: Use `window.location.replace` instead

```tsx
// BEFORE — relies on Next.js client router
useEffect(() => {
  if (isHydrated && !token) {
    router.replace("/login");
  }
}, [isHydrated, token, router]);

// AFTER — uses browser-native redirect (always works)
useEffect(() => {
  if (isHydrated && !token) {
    window.location.replace("/login");
  }
}, [isHydrated, token]);
```

---

## Final Working Setup

### Architecture
```
[Browser] → [ngrok tunnel] → [Next.js :3001] → (pages)
                                    ↓
                              (proxy /api/*)
                                    ↓
                            [Express :5000] → [MongoDB]
```

### How to start everything

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (production):**
```bash
cd frontend
npx next build
npx next start --port 3001
```

**Terminal 3 — Ngrok:**
```bash
ngrok http 3001
```

### Key files changed
| File | Change |
|------|--------|
| `frontend/next.config.ts` | Added `rewrites()` to proxy `/api/*` → `localhost:5000` |
| `frontend/.env.local` | Changed API URL from `http://localhost:5000/api` to `/api` |
| `backend/app.js` | Updated CORS to allow `*.ngrok-free.app` origins dynamically |
| `frontend/src/shared/components/AuthGuard.tsx` | Changed redirect from `router.replace` to `window.location.replace` |

### Quick checklist when things go wrong
- [ ] Is the backend running? (`curl http://localhost:5000`)
- [ ] Is the frontend running? (`curl http://localhost:3001`)
- [ ] Is ngrok running? (`curl http://localhost:4040/api/tunnels`)
- [ ] Are you using the right protocol? (try both `http://` and `https://`)
- [ ] Is the port free? (kill old processes if EADDRINUSE)
- [ ] Blank page? → Build for production (`next build && next start`)
- [ ] CORS error? → Check backend allows the ngrok origin
- [ ] API calls failing? → Check rewrites in `next.config.ts` and `.env.local` uses `/api` (relative)
