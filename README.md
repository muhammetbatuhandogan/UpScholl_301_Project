# UpScholl_301_Project

Minimal full-stack bootstrap for local development:
- `frontend`: Vite app
- `backend`: FastAPI (Python)

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

This confirms the project reached a working first-level full-stack state.