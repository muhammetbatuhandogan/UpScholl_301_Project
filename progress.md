# Progress Log

## v1 - 21 Nisan 2026

### Completed
- Project planning finalized with `planv2.md` as primary roadmap.
- `planv2.md` improved with:
  - validation checkpoints
  - 6-item Definition of Done
  - beta/release gate clarifications
  - deployment and rollback strategy
  - frontend + backend + Supabase skeleton map
- `planv2.md` pushed to GitHub.

### Project Setup (Bootstrap)
- Monorepo root initialized with workspace-based `package.json`.
- `frontend` created with Vite.
- `backend` created with Express.
- Backend endpoints added:
  - `GET /health`
  - `GET /api/status`
- Frontend connected to backend status endpoint and renders runtime state.
- Local run documentation added to `README.md`.
- `.gitignore` added for Node environment artifacts.

### Current Status
- Frontend and backend can run locally.
- Current stage is bootstrap only (no feature CRUD implemented yet).
- Next focus: implement CRUD + visible interactive UI based on plan.

### Next Step (Planned)
- Build first functional module with real CRUD (tasks-focused starter scope).
- Replace minimal landing page with dashboard-style UI.
- Connect UI to backend APIs with loading/error states.

## v2 - 22 Nisan 2026

### Backend Migration and API Updates
- Backend migrated from Express (`.js`) to FastAPI (`.py`).
- FastAPI project structure created under `backend/app`:
  - `routers`
  - `schemas`
  - `services`
- Task CRUD moved to FastAPI and validated with Pydantic models.
- Auth flow introduced with demo login:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Task routes protected with bearer token dependency.
- Backend run configuration updated to use Uvicorn on port `4010`.

### Frontend Updates
- Dashboard upgraded to live CRUD UI with:
  - create/update/delete task actions
  - summary counters
  - loading/empty/error states
  - toast feedback
- Login/logout UI added to frontend.
- Auth token helpers centralized in `frontend/src/core/auth.ts`.
- Frontend API requests now send bearer token headers.

### Rules and Project Hygiene
- FastAPI cursor rule scope fixed to Python files (`backend/**/*.py`).
- `.gitignore` improved for Python artifacts (`.venv`, `__pycache__`, `*.pyc`).
- Local run instructions updated in `README.md`.

### Verification Completed
- Health endpoint confirmed: `GET /health`.
- Auth flow verified:
  - unauthorized task access blocked
  - successful login with demo credentials
  - authenticated access to task list enabled
- CRUD flow tested after authentication.

### Current Status
- First-level frontend + backend setup is up and running locally.
- Even if UI is still iterative in some sections, core stack is operational:
  - backend starts
  - frontend starts
  - auth works
  - protected CRUD works
