from fastapi import FastAPI
from app.database import Base, engine
from app.routes import users, artists

Base.metadata.create_all(bind= engine)

app = FastAPI()

app.include_router(users.router)
app.include_router(artists.router)

users = []

@app.get("/")
def home():
    return {"message":"running"}

