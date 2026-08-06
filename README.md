# RailYatra — Railway Ticket Booking System

Full-stack railway ticket booking system with two role-gated portals
(passenger and admin), a React frontend and an Express + MongoDB backend.

## Architecture

```
rail-bliss-booking/
├── backend/    Express + MongoDB (Mongoose) REST API — auth, trains,
│               bookings, PNR status, payment gateway, admin management
└── frontend/   React 19 + Vite + React Router + TanStack Query SPA —
                the passenger and admin UIs
```

The two portals share one backend and one database; access is role-gated
(`passenger` / `admin`) exactly as described in `ll.md`.

## Requirements

- Node.js 20+
- MongoDB running locally (default `mongodb://127.0.0.1:27017`)

## Setup

### 1. Backend

```sh
cd backend
npm install
# configure backend/.env if needed (MONGODB_URI, JWT_SECRET, PORT)
npm run seed     # loads the 12-train timetable + demo accounts
npm run dev      # starts API on http://localhost:4000/api
```

### 2. Frontend

```sh
cd frontend
npm install
npm run dev      # starts SPA on http://localhost:5173 (proxies /api -> :4000)
```

Open http://localhost:5173.

## Demo accounts

| Role    | Email                 | Password     |
| ------- | --------------------- | ------------ |
| Admin   | admin@railyatra.dev   | admin123     |
| Passenger | passenger@railyatra.dev | password123 |

## Google OAuth Setup (optional)

To enable "Sign in with Google" on the auth page:

1. Go to [Google Cloud Console — Credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select an existing one)
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Application type: **Web application**
5. Name: anything (e.g. "RailYatra")
6. Under **Authorized JavaScript origins**, click **Add URI** → `http://localhost:5173`
7. Click **Create**
8. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)
9. Paste it in **both** `.env` files:

```sh
# backend/.env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# frontend/.env.local
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

10. Restart both backend and frontend dev servers

> **Note:** The Google button only appears if `VITE_GOOGLE_CLIENT_ID` is set. If it's missing, the auth page falls back to email/password only.

## API overview

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `GET /auth/me`
- Trains: `GET /trains`, `GET /trains/stations`, `GET /trains/:id`, `GET /trains/:id/availability`
- Bookings: `POST /bookings` (runs payment gateway, issues 10-digit PNR), `GET /bookings`, `POST /bookings/:id/cancel`
- PNR: `GET /pnr/:pnr`
- Payment: `POST /payments/charge`
- Admin (role-gated): `GET|POST|PATCH|DELETE /admin/trains`, `GET /admin/bookings`, `PATCH /admin/bookings/:id/status`

## Scripts

- Backend: `npm run dev / build / start / seed / typecheck`
- Frontend: `npm run dev / build / preview / typecheck`