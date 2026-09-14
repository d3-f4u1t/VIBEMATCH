import logging
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

logger = logging.getLogger("vibematch.db")

# ── Database URL: env first, sqlite fallback for local dev only ───────────────
# Production example: DATABASE_URL=postgresql+psycopg://user:pass@host:5432/vibematch
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vibematch.db")

_is_sqlite = DATABASE_URL.startswith("sqlite")

if _is_sqlite:
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    # Postgres / pooled production DB. Pool pre-ping avoids stale connections.
    engine = create_engine(DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)

# NOTE: historical typo was `SessionLoacl`. Keep an alias so old imports
# (e.g. scripts/seed_proxy_data.py) keep working while new code uses SessionLocal.
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
SessionLoacl = SessionLocal  # backwards-compat alias, do not use in new code

Base = declarative_base()

#this ensures that the data is formated with proper catagory for each of the given data or data set
def ensure_user_profile_columns():
    """Legacy backfill for old SQLite dev DBs created before profile fields existed.

    All columns already exist in the SQLAlchemy models, so fresh DBs (and Postgres
    with create_all / Alembic) need nothing. This only ALTERs an existing SQLite
    `users` table, one column at a time, and never fails boot.
    """
    if not _is_sqlite:
        return
    required_columns = {
        "date_of_birth": "DATE",
        "pronouns": "TEXT",
        "gender": "TEXT",
        "sexuality": "TEXT",
        "ethnicity": "TEXT",
        "height": "TEXT",
        "weight": "TEXT",
        "z_sign": "TEXT",
        "f_plan": "TEXT",
        "pets": "TEXT",
        "religion": "TEXT",
        "habit": "JSON",
    }

    try:
        with engine.begin() as connection:
            table_exists = connection.execute(
                text("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
            ).first()
            if not table_exists:
                return
            existing_columns = [
                row[1] for row in connection.execute(text("PRAGMA table_info(users)"))
            ]
            existing_columns_normalized = {column.lower() for column in existing_columns}

            for column_name, column_type in required_columns.items():
                if column_name.lower() not in existing_columns_normalized:
                    # column_name comes from a hardcoded allowlist above, safe to interpolate
                    connection.execute(
                        text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
                    )
                    logger.info("backfilled users.%s", column_name)
    except Exception:
        logger.exception("ensure_user_profile_columns backfill failed (non-fatal)")

#dependency

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
