# FinPilot AI

AI-powered Personal Finance Management application — track income, expenses, budgets, goals, and get financial insights.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts, Zustand |
| **Backend** | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| **Security** | Helmet, rate limiting, CORS, NoSQL sanitization, JWT refresh tokens |
| **Testing** | Jest, Supertest, MongoDB Memory Server |
| **Deployment** | Vercel (frontend), Render (API), Docker, MongoDB Atlas |

---

## Live deployment

| | URL |
|---|-----|
| **Frontend** | https://fin-pilot-ai-eight.vercel.app |
| **API health** | https://finpilot-backend-5660.onrender.com/api/health |

**Vercel env (Production + Preview):**

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://finpilot-backend-5660.onrender.com/api` |
| `VITE_GOOGLE_CLIENT_ID` | Same **Web application** OAuth client ID as `GOOGLE_CLIENT_ID` on Render |

Redeploy after any change — Vite bakes `VITE_*` at **build** time. Without `VITE_GOOGLE_CLIENT_ID`, Login/Register hide the Google button entirely.

**Google Cloud Console** → OAuth client → **Authorized JavaScript origins:** `https://fin-pilot-ai-eight.vercel.app` and `http://localhost:5173`.

**Render env (required):** `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CLIENT_URL=https://fin-pilot-ai-eight.vercel.app`, `GOOGLE_CLIENT_ID` (same as Vercel), `NODE_ENV=production`, plus `SMTP_*` and `EMAIL_FROM` for email.

---

## Features

- User authentication (register, login, JWT + refresh tokens)
- Transactions (CRUD, filters, pagination, CSV import **preview**, export)
- Legacy **category migration** (Settings)
- Dashboard & analytics charts
- Monthly budgets with auto-sync from expenses
- Savings goals with progress tracking
- Recurring transactions (create, **edit**, pause, run now; cron scheduler)
- Notifications (budget exceeded, goals, large expenses)
- AI financial insights (rule-based, OpenAI-ready)
- Profile, settings, avatar upload, i18n structure (EN/HI)

---

## Project Structure

```
FinPilotAI-main/
├── client/          # React frontend
├── server/          # Express API
├── docs/            # Postman collection
├── docker-compose.yml
└── README.md
```

---

## Quick Start (Local Development)

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- npm

### 1. Clone & install

```bash
cd FinPilotAI-main/server
npm install

cd ../client
npm install
```

### 2. Configure environment

**Server** — copy and edit:

```bash
cp server/.env.example server/.env
```

Required variables:
- `MONGODB_URI`
- `JWT_SECRET` (32+ chars)
- `JWT_REFRESH_SECRET` (32+ chars)
- `CLIENT_URL=http://localhost:5173`

**Client** — copy:

```bash
cp client/.env.example client/.env
```

Use `VITE_API_URL=/api` for Vite dev proxy.

### 3. Run

```bash
# Terminal 1 — API
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:5000
- Swagger docs: http://localhost:5000/api/docs

---

## Docker Deployment

### 1. Configure Docker env

Copy `server/.env.docker.example` to `server/.env.docker` (gitignored) and set secure JWT secrets:

```bash
JWT_SECRET=your_secure_secret_at_least_32_characters
JWT_REFRESH_SECRET=your_secure_refresh_secret_32_chars
```

### 2. Start all services

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API | http://localhost:5000 |
| MongoDB | localhost:27017 |
| Swagger | http://localhost:5000/api/docs |

### 3. Stop

```bash
docker compose down
```

---

## API Documentation

- **Swagger UI:** `GET /api/docs`
- **OpenAPI JSON:** `GET /api/docs.json`
- **Postman:** Import `docs/FinPilotAI.postman_collection.json`

### Auth flow

1. `POST /api/auth/register` — create account
2. `POST /api/auth/login` — returns `accessToken` + sets refresh cookie
3. Use `Authorization: Bearer <accessToken>` for protected routes
4. `POST /api/auth/refresh-token` — refresh expired access token

### Email (password reset & verification)

Set SMTP in `server/.env` so reset links go to the inbox (not only the server console):

| Variable | Example |
|----------|---------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | your mailbox |
| `SMTP_PASS` | app password / SMTP key |
| `EMAIL_FROM` | `FinPilot AI <you@gmail.com>` |
| `CLIENT_URL` | must match frontend URL in reset links |

On startup the API logs `Email: SMTP connected and ready` or a verify error.  
If `SMTP_HOST` is empty, forgot-password links appear in the **API terminal** (development).

---

## Testing

```bash
cd server
npm test
```

35 tests covering auth, transactions, budgets, recurring, and category migration (service + API).

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLIENT_URL` to your frontend domain
- [ ] Configure `SMTP_*` and `EMAIL_FROM` for password reset / verification email
- [ ] Enable HTTPS (reverse proxy / load balancer)
- [ ] Set `OPENAI_API_KEY` if using AI provider `openai`
- [ ] Review rate limits in `.env.production.example`

---

## Environment Files

| File | Purpose |
|------|---------|
| `server/.env.example` | Local development |
| `server/.env.production.example` | Production reference |
| `server/.env.docker.example` | Docker Compose template (copy to `.env.docker`) |
| `client/.env.example` | Local dev |
| `client/.env.production.example` | Production build |

---

## License

ISC
