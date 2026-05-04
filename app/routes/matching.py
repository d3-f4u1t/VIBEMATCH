from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
#app IMPORTS
from app.database import get_db
from app.models.user import User
from app.services.vector import cosine_similarity

router = APIRouter(tags=["matching"])

@router.get("/match/{user_id}")
def get_matches(user_id: str, db:Session = Depends(get_db), limit: int = 10):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code= 404, detail="User not found")
    
    if not user.music_vector:
        raise HTTPException(
            status_code= 400,
            detail="User has no music vector yet"
        )

    if len(user.artists) < 3 or len(user.tracks) < 4:
        raise HTTPException(
            status_code=400,
            detail="User must complete the music profile before matching"
        )
    
    other_users = (
        db.query(User)
        .filter(User.id != user_id)
        .all()
    )

    matches = []

    for other in other_users:
        if not other.music_vector:
            continue
        if len(other.artists) < 3 or len(other.tracks) < 4:
            continue

        similarity= cosine_similarity(user.music_vector, other.music_vector)

        matches.append({
            "user_id": other.id,
            "name": other.name,
            "similarity": round(similarity,4),
        })

    matches.sort(key = lambda item: item["similarity"], reverse= True)

    return {
        "user_id" : user_id,
        "match_count": len(matches[:limit]),
        "matches": matches[:limit],
    }
