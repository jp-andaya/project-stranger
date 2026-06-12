"""
Project Stranger — Backend API

FastAPI server with PostgreSQL database.
Run with: uvicorn main:app --reload --port 8001
API docs: http://localhost:8001/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes import notes, prompts, admin

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# ──────────────────────────────────────
#  APP SETUP
# ──────────────────────────────────────

app = FastAPI(
    title="Project Stranger API",
    description="Anonymous storytelling mental health app — backend API",
    version="1.0.0",
)

# CORS — allow the React frontend to talk to us
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",    # Vite dev server
        "http://localhost:5173",    # Vite alternate port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────
#  ROUTES
# ──────────────────────────────────────

app.include_router(notes.router)
app.include_router(prompts.router)
app.include_router(admin.router)


# ──────────────────────────────────────
#  ROOT
# ──────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    return {
        "app": "Project Stranger",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
