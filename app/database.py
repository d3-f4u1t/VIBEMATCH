from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "sqlite:///./vibematch.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread":False}

)
SessionLoacl = sessionmaker(bind=engine, autoflush = False, autocommit = False)

base = declarative_base()

#dependency

def get_db():
    db = SessionLoacl()
    try:
        yield db
    finally:
        db.close()