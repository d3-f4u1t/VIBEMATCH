from fastapi import FastAPI
from app.database import Base, engine, ensure_user_profile_columns
from app.routes import users, artists, auth, matching, swipe

Base.metadata.create_all(bind= engine)
ensure_user_profile_columns()

app = FastAPI(title= "VIBEMatch API", version = "0.3.0")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(artists.router)
app.include_router(matching.router)
app.include_router(swipe.router)

@app.get("/")
def home():
    return {"message": "running"}

# FOR LOCAL
# uvicorn app.main:app --reload
# FOR HOSTING
# in the Terminal
# cd C:\Users\hkpan\VIBEMATCH
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# back end testing:   172.24.102.214
# use this command for dev mode
# and /docs for API documentation
#for starting the frontend:
'''
cd mobile

& "C:\Program Files\nodejs\nnpm.cmd" start
    cmd /c npm start
'''

