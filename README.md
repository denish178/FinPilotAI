# FinPilot AI

AI-powered Personal Finance Management application — track income, expenses, budgets, goals, and get financial insights.

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React, Vite, Tailwind CSS, React Router, Axios, React Hook Form, Recharts, Zustand |
| **Backend** | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt |
| **Security** | Helmet, rate limiting, CORS, NoSQL sanitization, JWT refresh tokens |
| **Testing** | Jest, Supertest, MongoDB Memory Server |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## Features

- User authentication (register, login, JWT + refresh tokens)
- Transactions (CRUD, filters, pagination, CSV import/export)
- Dashboard & analytics charts
- Monthly budgets with auto-sync from expenses
- Savings goals with progress tracking
- Recurring transactions (cron scheduler)
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

Edit `server/.env.docker` and set secure JWT secrets:

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

---

## Testing

```bash
cd server
npm test
```

29 tests covering auth, transactions, budgets (service + API).

---

## Production Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Use MongoDB Atlas or managed MongoDB
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CLIENT_URL` to your frontend domain
- [ ] Enable HTTPS (reverse proxy / load balancer)
- [ ] Set `OPENAI_API_KEY` if using AI provider `openai`
- [ ] Review rate limits in `.env.production.example`

---

## Environment Files

| File | Purpose |
|------|---------|
| `server/.env.example` | Local development |
| `server/.env.production.example` | Production reference |
| `server/.env.docker` | Docker Compose |
| `client/.env.example` | Local dev |
| `client/.env.production.example` | Production build |

---

## License

ISC
