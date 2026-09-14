import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine, ensure_user_profile_columns
from app.limiter import limiter
from app.routes import artists, auth, chat, matching, safety, swipe, users

load_dotenv()

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("vibematch")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables for dev/small-test deploys. For larger prod use Alembic.
    Base.metadata.create_all(bind=engine)
    ensure_user_profile_columns()
    logger.info("VIBEMatch API starting (env=%s)", os.getenv("VIBEMATCH_ENV", "development"))
    yield


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="VIBEMatch API", version="0.3.1", lifespan=lifespan)

# Attach the rate limiter to the app state so decorators can use it
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded. Try again shortly."})


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    # exc.errors() contains non-serializable ValueError in ctx — sanitize.
    safe_errors = []
    for err in exc.errors():
        ctx = err.get("ctx")
        if isinstance(ctx, dict) and "error" in ctx:
            ctx = {**ctx, "error": str(ctx["error"])}
        safe_errors.append({**err, "ctx": ctx} if ctx is not None else err)
    return JSONResponse(status_code=422, content={"detail": "Invalid request", "errors": safe_errors})


@app.exception_handler(Exception)
async def unhandled_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ── CORS ───────────────────────────────────────────────────────────────────────
# Never allow `*` together with credentials. In production set
# VIBEMATCH_CORS_ORIGINS to an explicit comma-separated list.
raw_origins = os.getenv("VIBEMATCH_CORS_ORIGINS", "*")
if raw_origins.strip() == "*":
    if os.getenv("VIBEMATCH_ENV", "development").lower() == "production":
        raise RuntimeError("VIBEMATCH_CORS_ORIGINS=* is not allowed in production. Set explicit origins.")
    allowed_origins = ["*"]
    allow_credentials = False
else:
    allowed_origins = [o.strip() for o in raw_origins.split(",") if o.strip()]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# Behind Render/Fly/etc. the app still validates Host to block Host-header attacks.
# Set VIBEMATCH_TRUSTED_HOSTS="api.example.com" in production; default allows all for dev.
_trusted = [h.strip() for h in os.getenv("VIBEMATCH_TRUSTED_HOSTS", "*").split(",") if h.strip()]
app.add_middleware(TrustedHostMiddleware, allowed_hosts=_trusted)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(artists.router)
app.include_router(matching.router)
app.include_router(swipe.router)
app.include_router(chat.router)
app.include_router(safety.router)


@app.get("/")
def home():
    return {"message": "running", "version": "0.3.1"}


@app.get("/healthz")
def healthz():
    return {"status": "ok", "version": "0.3.1"}


# ── Local dev commands ─────────────────────────────────────────────────────────
# Local:   uvicorn app.main:app --reload
# Network: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# Docs:    http://localhost:8000/docs
# Prod:    gunicorn app.main:app -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --workers 2
