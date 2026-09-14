import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import Base, engine, ensure_user_profile_columns
from app.routes import artists, auth, chat, matching, swipe, users

load_dotenv()

# ── Rate limiter ───────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── App ────────────────────────────────────────────────────────────────────────
Base.metadata.create_all(bind=engine)
ensure_user_profile_columns()

app = FastAPI(title="VIBEMatch API", version="0.3.1")

# Attach the rate limiter to the app state so decorators can use it
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────────
raw_origins = os.getenv("VIBEMATCH_CORS_ORIGINS", "*")
# Support wildcard OR a comma-separated list of specific origins
if raw_origins.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(artists.router)
app.include_router(matching.router)
app.include_router(swipe.router)
app.include_router(chat.router)


@app.get("/")
def home():
    return {"message": "running", "version": "0.3.1"}


# ── Local dev commands ─────────────────────────────────────────────────────────
# Local:   uvicorn app.main:app --reload
# Network: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Docs:    http://localhost:8000/docs
