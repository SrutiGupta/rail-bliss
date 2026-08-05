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

## API overview

- Auth: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- Trains: `GET /trains`, `GET /trains/stations`, `GET /trains/:id`, `GET /trains/:id/availability`
- Bookings: `POST /bookings` (runs payment gateway, issues 10-digit PNR), `GET /bookings`, `POST /bookings/:id/cancel`
- PNR: `GET /pnr/:pnr`
- Payment: `POST /payments/charge`
- Admin (role-gated): `GET|POST|PATCH|DELETE /admin/trains`, `GET /admin/bookings`, `PATCH /admin/bookings/:id/status`

## Scripts

- Backend: `npm run dev / build / start / seed / typecheck`
- Frontend: `npm run dev / build / preview / typecheck`