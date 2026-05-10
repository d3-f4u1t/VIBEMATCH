from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./vibematch.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread":False}

)
SessionLoacl = sessionmaker(bind=engine, autoflush = False, autocommit = False)

Base = declarative_base()


def ensure_user_profile_columns():
    required_columns = {
        "date_of_birth": "DATE",
        "pronouns": "TEXT",
        "gender": "TEXT",
        "sexuality": "TEXT",
    }

    with engine.begin() as connection:
        existing_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(users)"))
        }

        for column_name, column_type in required_columns.items():
            if column_name not in existing_columns:
                connection.execute(
                    text(
                        f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                    )
                )

#dependency

def get_db():
    db = SessionLoacl()
    try:
        yield db
    finally:
        db.close()
