# ── Project Stranger backend — FastAPI + SQLite ──
FROM python:3.12-slim

# Don't write .pyc files; flush stdout/stderr immediately (better container logs)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install deps first so this layer is cached unless requirements.txt changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY . .

# SQLite file is written to the working dir as ./stranger.db.
# docker-compose mounts a named volume here so data survives restarts.
EXPOSE 8001

# Seed once (seed_data.py is idempotent — skips if already populated), then serve.
CMD ["sh", "-c", "python seed_data.py && uvicorn main:app --host 0.0.0.0 --port 8001"]
