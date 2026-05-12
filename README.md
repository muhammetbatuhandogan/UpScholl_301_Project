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

3) Start backend (Terminal 1):

```bash
npm run dev --workspace backend
```

4) Start frontend (Terminal 2):

```bash
npm run dev --workspace frontend
```

## My Working Flow (Windows / Python 3.11)

This is the exact flow that successfully worked on this project:

1) Open Terminal 1 at project root and activate venv:

```bash
.venv\Scripts\activate
```

2) Start backend:

```bash
npm run dev --workspace backend
```

Expected backend log:
- `Uvicorn running on http://0.0.0.0:4010`

3) Open Terminal 2 at project root and start frontend on fixed port:

```bash
npm run dev --workspace frontend -- --host --port 5173
```

Expected frontend log:
- `Local: http://localhost:5173/`

4) Open app and verify:
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

## Reviewer Quick Check

If someone opens this repository and wants to verify that the project is running end-to-end:

1. Start backend and frontend with the commands above.
2. Open frontend URL from terminal output (Vite may auto-switch to `5174`/`5175` if `5173` is busy).
3. Login with demo credentials.
4. Confirm:
   - backend health works (`/health`)
   - login succeeds
   - task CRUD works after login
5. Optional UI pass (no backend required): open **Onboarding**, **Bag**, **Family**, and **Emergency** tabs and confirm forms/lists render and persist after a refresh (`localStorage`).

This confirms the project reached a working first-level full-stack state with the current MVP-style modules.