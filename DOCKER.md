# Running Pondr with Docker

Three containers, one command — no local Python, Node, or database setup required.

| Container   | What it is                              | Port                        |
|-------------|------------------------------------------|-----------------------------|
| `frontend`  | React build served by nginx              | `3000` → app                |
| `backend`   | FastAPI + SQLite                         | `8001` → API/docs           |
| `db-viewer` | Read-only SQLite browser (dev tool only) | `127.0.0.1:8080` → DB browser |

The frontend's nginx reverse-proxies `/api/*` to the backend, so the browser
only talks to one origin (no CORS config). SQLite data lives in the
`backend-data` named volume and survives restarts.

## Quick start

```bash
cd project-stranger
docker compose up --build
```

- App:       http://localhost:3000
- API docs:  http://localhost:8001/docs
- DB viewer: http://localhost:8080 (read-only, loopback-only — not part of the app)

Stop with `Ctrl+C`, or `docker compose down`. The database persists.
To wipe the database too: `docker compose down -v`.

## Common commands

```bash
docker compose up -d --build     # run in the background
docker compose logs -f backend   # tail backend logs
docker compose restart frontend  # restart one service
docker compose down              # stop (keeps data)
docker compose down -v           # stop and delete the data volume
```

## Notes

- **Database**: `backend/database.py` reads `DATABASE_URL` (defaults to a local
  SQLite file for non-Docker dev). Compose sets it to
  `sqlite:////data/stranger.db` on the mounted volume.
- **Seeding**: the backend runs `seed_data.py` on startup; it's idempotent and
  skips if the database is already populated.
- **Frontend API URL**: baked at build time via the `VITE_API_URL` build arg.
  Empty (the default in compose) = same-origin relative calls. For a setup where
  the frontend calls the backend on a different host, rebuild with
  `--build-arg VITE_API_URL=https://api.example.com`.

## Dev-only DB viewer

`db-viewer` (image `coleifer/sqlite-web`) mounts the same `backend-data`
volume read-only and serves a browsable SQLite UI at
`http://127.0.0.1:8080`. Leave the tab open and refresh it to see live
notes/wins as you use the app — no need to `docker cp` the file out.
It's bound to loopback only (the DB has emails and password hashes in
it) and isn't part of the deployed app; drop the service from
`docker-compose.yml` for a production build.

## Deploying

Both images are standard and deploy to any container host (Render, Railway,
Fly.io, a VPS, etc.). For a managed Postgres instead of SQLite, set
`DATABASE_URL` to the Postgres URL and add `psycopg2-binary` to
`backend/requirements.txt` — no other code changes needed.
