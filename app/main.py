from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users, artists,auth

Base.metadata.create_all(bind= engine)

app = FastAPI(title= "VIBEMatch API", version = "0.3.0")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(artists.router)

@app.get("/")
def home():
    return {"message": "running"}
'''
uvicorn app.main:app --reload
use this command for dev mode
and /docs for API documentation
'''
