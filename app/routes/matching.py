from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
#app IMPORTS
from app.database import get_db
from app.models.user import User
from app.schemas.matching import MatchResponse
from app.services.vector import cosine_similarity
from app.services.swipe import get_users_already_swiped

router = APIRouter(tags=["matching"])

def build_match_reason(shared_artists: list[str], shared_tracks: list[str], similarity: float) -> str:
    if shared_tracks:
        return f"You both connect with songs like {', '.join(shared_tracks[:2])}"
    if shared_artists:
        return f"Strong overlap in artists like {', '.join(shared_artists[:2])}"
    
    if similarity >= 0.8:
        return "Very strong music taste compatibility"
    
    if similarity >= 0.6:
        return "Good music taste compatibility"
    return "Some overlap in music taste"



@router.get("/match/{user_id}", response_model=MatchResponse)
def get_matches(
    user_id: str,
    db: Session = Depends(get_db),
    limit: int = 10,
    exclude_swiped: bool = False
):
    """
    Get matches for a user based on music vector similarity.
    
    - **user_id**: User to find matches for
    - **limit**: Maximum number of matches to return (default 10)
    - **exclude_swiped**: If True, excludes users already swiped on (default False)
    """
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

    user_artist_names = {artist.name for artist in user.artists if artist.name}
    user_track_titles = {track.title for track in user.tracks if track.title}

    # Get already swiped users if requested
    already_swiped = set()
    if exclude_swiped:
        already_swiped = get_users_already_swiped(user_id, db)

    matches = []

    for other in other_users:
        # Skip if already swiped (if requested)
        if exclude_swiped and other.id in already_swiped:
            continue
            
        if not other.music_vector:
            continue
        if len(other.artists) < 3 or len(other.tracks) < 4:
            continue

        similarity= cosine_similarity(user.music_vector, other.music_vector)
        other_artist_names = {artist.name for artist in other.artists if artist.name}
        other_track_titles = {track.title for track in other.tracks if track.title}

        shared_artists = sorted(user_artist_names & other_artist_names)
        shared_tracks = sorted(user_track_titles & other_track_titles)

        matches.append({
            "user_id": other.id,
            "name": other.name,
            "similarity": round(similarity,4),
            "artist_count": len(other.artists),
            "track_count": len(other.tracks),
            "shared_artists": shared_artists,
            "shared_tracks": shared_tracks,
            "match_reason": build_match_reason(shared_artists, shared_tracks, similarity),
        })

    matches.sort(key = lambda item: item["similarity"], reverse= True)

    return {
        "user_id" : user_id,
        "match_count": len(matches[:limit]),
        "matches": matches[:limit],
    }
