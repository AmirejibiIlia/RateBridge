# RateBridge

**RateBridge** is a multi-company feedback management platform. Businesses generate QR codes, place them at customer touchpoints, and collect anonymous 1–10 ratings with optional comments — no app download required for customers.

---

## The Problem

Most businesses have no idea what customers actually think in the moment. Traditional feedback methods fail:

- **Paper forms** get ignored, lost, or filled out days later
- **Email surveys** have <5% response rates
- **Review platforms** only capture extreme opinions (very happy or very angry)
- **Verbal feedback** is filtered by politeness and forgotten immediately

The gap between what customers experience and what businesses hear is enormous.

---

## The Solution

RateBridge makes feedback frictionless:

1. **Business generates a QR code** and places it at any touchpoint — a table, a counter, a receipt, a hotel room door
2. **Customer scans it** with their phone camera — no app, no login
3. **Customer taps a rating 1–10** and optionally leaves a comment — takes 10 seconds
4. **Business sees the data instantly** on a dashboard with charts, trends, and highlights

---

## Features

### For Businesses
- **QR Code Generator** — create unlimited QR codes per location, station, or product with custom labels
- **Editable labels** — rename QR codes anytime without regenerating them
- **Dashboard** — overall stats (total responses, average rating) with rating distribution chart
- **Per-QR analytics** — separate breakdown for each QR code to identify which locations perform best and worst
- **Top & Worst Feedback** — instantly see your 3 best and 3 worst responses side by side
- **Full Feedback History** — paginated list of all responses with ratings, comments, and timestamps

### For Customers
- **Zero friction** — scan QR → rate → done. No account, no app, no personal info required
- **Mobile-first UI** — large tap targets, works on any phone
- **Anonymous** — only IP address is stored (for spam prevention), never linked to identity

### For Platform Admins
- **Super Admin panel** — view all registered companies, their response counts, and average ratings in one table

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python 3.11) |
| Database | PostgreSQL + SQLAlchemy |
| Authentication | JWT (24h tokens) |
| Password hashing | bcrypt via passlib |
| QR Generation | `qrcode` library → base64 PNG |
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| Charts | Recharts |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Deployment | Railway (backend + frontend + PostgreSQL) |

---

## Getting Started

### Prerequisites
- Docker and Docker Compose

### Run locally

```bash
git clone https://github.com/AmirejibiIlia/RateBridge.git
cd RateBridge
cp .env.example .env   # edit values if needed
docker-compose up
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |

### Environment variables

**Backend:**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | Random 32-char string for JWT signing |
| `SUPERADMIN_EMAIL` | Email for the super admin account |
| `SUPERADMIN_PASSWORD` | Password for the super admin account |
| `FRONTEND_URL` | Frontend origin (used for CORS) |

**Frontend:**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

---

## Deployment (Railway)

The app is designed for one-click deployment on [Railway](https://railway.app):

1. Fork this repo and connect it to a new Railway project
2. Add a **PostgreSQL** plugin — `DATABASE_URL` is injected automatically
3. Add a **backend service** — set Root Directory to `backend`, add the 5 env vars above
4. Add a **frontend service** — set Root Directory to `frontend`, add `VITE_API_URL`
5. Generate public domains for both services in Railway's Networking settings

---

## Project Structure

```
RateBridge/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── models/   # SQLAlchemy ORM models
│   │   ├── schemas/  # Pydantic request/response schemas
│   │   ├── services/ # Business logic (OOP service classes)
│   │   ├── routers/  # API route handlers
│   │   └── core/     # JWT auth, password hashing, dependencies
│   └── requirements.txt
└── frontend/         # React + TypeScript SPA
    └── src/
        ├── pages/    # Route-level page components
        ├── components/ # Reusable UI components
        ├── api/      # Axios API wrappers
        └── context/  # Auth context (global user state)
```

---

## API Overview

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register company + admin user |
| POST | `/api/auth/login` | Public | Get JWT token |
| GET | `/api/auth/me` | JWT | Current user info |
| GET | `/api/company/dashboard` | JWT | Company stats |
| GET | `/api/company/feedback` | JWT | Paginated feedback list |
| GET | `/api/company/feedback/highlights` | JWT | Top 3 & worst 3 feedback |
| GET | `/api/company/qr-codes` | JWT | List QR codes (with images) |
| POST | `/api/company/qr-codes` | JWT | Create QR code |
| PATCH | `/api/company/qr-codes/{id}` | JWT | Rename QR code |
| GET | `/api/company/qr-codes/{id}/stats` | JWT | Per-QR feedback stats |
| DELETE | `/api/company/qr-codes/{id}` | JWT | Delete QR code |
| GET | `/api/feedback/{uuid}` | Public | QR code info (for feedback page) |
| POST | `/api/feedback/{uuid}` | Public | Submit anonymous feedback |
| GET | `/api/superadmin/companies` | SuperAdmin | All companies + stats |
| GET | `/api/superadmin/feedback` | SuperAdmin | All feedback across companies |

---

## License

MIT
