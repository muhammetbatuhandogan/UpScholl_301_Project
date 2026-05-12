# UpScholl_301_Project

Minimal full-stack bootstrap for local development:
- `frontend`: Vite app
- `backend`: FastAPI (Python)
- `docker-compose.yml`: PostgreSQL 16 (local dev only; default credentials in compose)

## PostgreSQL (Docker)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/) running.

1) From the **project root**:

```bash
docker compose up -d
```

2) Wait until the container is healthy (Docker Desktop → Containers → `upscholl_postgres`, or `docker compose ps`).

3) Default connection (override with a root `.env` copied from `.env.example`):

- Host: `localhost`
- Port: `5432` (change `POSTGRES_PORT` in `.env` if this port is already used on your machine)
- Database: `upscholl`
- User: `upscholl`
- Password: `upscholl_dev`

Stop without deleting data: `docker compose stop`.  
Remove container but keep volume: `docker compose down`.  
**Wipe database volume:** `docker compose down -v`.

## Run Locally

1) Install dependencies:

```bash
npm install
```

2) Setup backend Python environment (Terminal 1):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
```

3) Apply database migrations (same terminal, **after** Postgres is up):

```bash
npm run db:upgrade --workspace backend
```

This runs Alembic (`backend/alembic`) and creates tables plus the demo user and sample tasks. New schema changes: add a revision under `backend/alembic/versions/` (you can write raw SQL with `op.execute` or use `op.add_column`, etc.).

4) Start backend (Terminal 1):

```bash
npm run dev --workspace backend
```

On Windows, `backend` scripts call **`..\\.venv\\Scripts\\python.exe`** so you do not rely on `PATH` or having activated the venv in that same shell (avoids picking up a different system `python`).

5) Start frontend (Terminal 2):

```bash
npm run dev --workspace frontend
```

## My Working Flow (Windows / Python 3.11)

This is the exact flow that successfully worked on this project:

> **macOS / Linux:** `backend/package.json` points at `..\\.venv\\Scripts\\python.exe` (Windows). Use `../.venv/bin/python3` in those scripts, or run uvicorn manually from `backend` with your venv Python.

1) Open Terminal 1 at project root (venv activation is **optional** for `npm run dev --workspace backend` on Windows; scripts use `.venv` explicitly).

2) Ensure Postgres is running (`docker compose up -d` from repo root if needed).

3) Apply migrations (once per machine / after pulling new migrations):

```bash
npm run db:upgrade --workspace backend
```

4) Start backend:

```bash
npm run dev --workspace backend
```

Expected backend log:
- `Uvicorn running on http://0.0.0.0:4010`

5) Open Terminal 2 at project root and start frontend on fixed port:

```bash
npm run dev --workspace frontend -- --host --port 5173
```

Expected frontend log:
- `Local: http://localhost:5173/`

6) Open app and verify:
- Frontend: `http://localhost:5173/`
- Backend health: `http://localhost:4010/health`
- Login with:
  - Username: `demo`
  - Password: `demo123`

## Local Links

- Frontend app: [http://localhost:5173/](http://localhost:5173/)
- Backend health: [http://localhost:4010/health](http://localhost:4010/health)
- Backend status API: [http://localhost:4010/api/status](http://localhost:4010/api/status)

## Demo Login

- Username: `demo`
- Password: `demo123`

## Backend API (current web stack)

After `npm run db:upgrade --workspace backend`, OpenAPI docs: [http://localhost:4010/docs](http://localhost:4010/docs)

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | No | Includes `database` connectivity |
| GET | `/api/status` | No | |
| POST | `/api/auth/login` | No | Demo user + bcrypt |
| POST | `/api/auth/logout` | Bearer | Revokes current access token |
| GET | `/api/auth/me` | Bearer | |
| GET/POST/PUT/DELETE | `/api/tasks` | Bearer | Per-user tasks |
| POST | `/api/analytics/events` | Optional Bearer | Funnel events; `user_id` set when token valid |
| GET/PUT | `/api/onboarding` | Bearer | Server-side onboarding snapshot |

**Planv2 not yet in this repo (backend):** real OTP/SMS, JWT refresh, Netgsm SOS, push notification dispatch, family invite APIs — track under product backlog.

## Reviewer Quick Check

If someone opens this repository and wants to verify that the project is running end-to-end:

1. `docker compose up -d` (repo root) and wait until Postgres is healthy.
2. `pip install -r backend/requirements.txt`, then `npm run db:upgrade --workspace backend`.
3. Start backend and frontend with the commands above.
4. Open frontend URL from terminal output (Vite may auto-switch to `5174`/`5175` if `5173` is busy).
5. Login with demo credentials.
6. Confirm:
   - `/health` shows `"database": "connected"` when Postgres is reachable
   - login succeeds
   - task CRUD works after login
7. Optional UI pass (no backend required): open **Onboarding**, **Bag**, **Family**, and **Emergency** tabs and confirm forms/lists render and persist after a refresh (`localStorage`).

This confirms the project reached a working first-level full-stack state with the current MVP-style modules.