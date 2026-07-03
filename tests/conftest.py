import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app
from app.services import vector

# Mock SentenceTransformer encoding to avoid loading 120MB model during tests
class MockSentenceTransformer:
    def encode(self, text, normalize_embeddings=True):
        # MiniLM-L6-v2 returns 384 dimensions. We return a normalized mock vector.
        import numpy as np
        vec = np.zeros(384)
        vec[0] = 1.0  # static normalized vector
        return vec

@pytest.fixture(autouse=True)
def mock_sentence_transformer(monkeypatch):
    mock_model = MockSentenceTransformer()
    monkeypatch.setattr(vector, "get_model", lambda: mock_model)

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="session")
def engine():
    return create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

@pytest.fixture(scope="session")
def tables(engine):
    # Register models by importing them
    import app.models
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(engine, tables):
    connection = engine.connect()
    transaction = connection.begin()
    
    Session = sessionmaker(bind=connection, autoflush=False, autocommit=False)
    db = Session()
    
    yield db
    
    db.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
