# Pondr

An anonymous, prompt-led wellbeing app. Each day brings a shared prompt; people
answer with short anonymous notes, track personal wins with streaks, and can
capture a win as a view-once photo "instant". Accounts are pseudonymous
(auto-assigned @number plus a chosen handle), content is moderated, and the
Support tab points to the MIND mental health charity.

**Stack:** React 18 + Vite + Tailwind (frontend) · FastAPI + SQLAlchemy +
SQLite (backend) · JWT auth · Docker Compose for deployment.

## Run with Docker (recommended)

No local Python or Node needed; one command builds and starts everything:

```bash
docker compose up --build
```

- App: http://localhost:3000
- API docs: http://localhost:8001/docs

The database seeds itself on first start and persists in a named volume.
See [DOCKER.md](DOCKER.md) for details, common commands, and the optional
read-only DB viewer.

## Run locally (dev)

Two terminals: backend first, then frontend.

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows; on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python seed_data.py           # create + seed the SQLite database
uvicorn main:app --reload --port 8001
```

**Frontend** (Node 18+):

```bash
npm install
npm run dev
```

Open http://localhost:3000. The Vite dev server proxies `/api/*` to the
backend on port 8001, mirroring the nginx proxy used in Docker.

## Tests

```bash
cd backend
pytest
```

## More docs

- [ARCHITECTURE.md](ARCHITECTURE.md): how the containers fit together, request
  flow, image builds, and data persistence (Mermaid diagrams).
- [DOCKER.md](DOCKER.md): day-to-day Docker usage and deployment notes.
