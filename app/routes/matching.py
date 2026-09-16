from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, selectinload
#app IMPORTS
from app.auth import get_current_user
from app.database import get_db
from app.limiter import limiter
from app.models.safety import Block
from app.models.user import User
from app.schemas.matching import MatchResponse
from app.services.vector import (
    build_match_reason_explainable,
    compatibility_score,
    passes_hard_filters,
    shared_display_names,
)
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
@limiter.limit("60/minute")
def get_matches(
    request: Request,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(default=10, ge=1, le=25),
    exclude_swiped: bool = True,
):
    """
    Get matches for a user based on music vector similarity.
    
    - **user_id**: User to find matches for (must be yourself)
    - **limit**: Maximum number of matches to return (1-25, default 10)
    - **exclude_swiped**: If True, excludes users already swiped on (default True)
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="not allowed")

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
    
    # Exclude users blocked in either direction
    blocked_rows = (
        db.query(Block)
        .filter((Block.blocker_id == user_id) | (Block.blocked_user_id == user_id))
        .all()
    )
    blocked_ids: set[str] = set()
    for b in blocked_rows:
        blocked_ids.add(b.blocker_id)
        blocked_ids.add(b.blocked_user_id)
    blocked_ids.discard(user_id)

    other_users = (
        db.query(User)
        .options(selectinload(User.artists), selectinload(User.tracks))
        .filter(User.id != user_id)
        .limit(500)
        .all()
    )

    # Same straight-preference filter as swipe/next for parity
    user_gender = (user.gender or "").strip().lower()
    user_sexuality = (user.sexuality or "").strip().lower()
    prefers_opposite = any(
        k in user_sexuality for k in ("straight", "hetero", "heterosexual")
    )
    is_man = user_gender in {"man", "male", "m"}
    is_woman = user_gender in {"woman", "female", "f", "w"}

    user_artist_names = [artist.name for artist in user.artists]
    user_track_titles = [track.title for track in user.tracks]

    # Get already swiped users if requested
    already_swiped = set()
    if exclude_swiped:
        already_swiped = get_users_already_swiped(user_id, db)

    matches = []

    for other in other_users:
        if other.id in blocked_ids:
            continue
        # Skip if already swiped (if requested)
        if exclude_swiped and other.id in already_swiped:
            continue

        if prefers_opposite:
            other_gender = (other.gender or "").strip().lower()
            if is_man and other_gender not in {"woman", "female", "f", "w"}:
                continue
            if is_woman and other_gender not in {"man", "male", "m"}:
                continue
            if not is_man and not is_woman and not other_gender:
                continue
            
        if not other.music_vector:
            continue
        if len(other.artists) < 3 or len(other.tracks) < 4:
            continue

        # Explicit-preference hard filters (age/intent/dealbreakers/tight-city), both directions
        if not passes_hard_filters(user, other):
            continue
        if not passes_hard_filters(other, user):
            continue

        comp = compatibility_score(user, other, db)
        similarity = comp["total"]
        other_artist_names = [artist.name for artist in other.artists]
        other_track_titles = [track.title for track in other.tracks]

        shared_artists = shared_display_names(user_artist_names, other_artist_names)
        shared_tracks = shared_display_names(user_track_titles, other_track_titles)

        matches.append({
            "user_id": other.id,
            "name": other.name,
            "similarity": similarity,
            "artist_count": len(other.artists),
            "track_count": len(other.tracks),
            "shared_artists": shared_artists,
            "shared_tracks": shared_tracks,
            "match_reason": build_match_reason_explainable(shared_artists, shared_tracks, comp),
            "bio": other.bio or "",
            "location_city": other.location_city or "",
            "pronouns": other.pronouns or "",
            "gender": other.gender or "",
            "sexuality": other.sexuality or "",
            "height": other.height or "",
            "weight": other.weight or "",
            "ethnicity": other.ethnicity or "",
            "z_sign": other.z_sign or "",
            "f_plan": other.f_plan or "",
            "pets": other.pets or "",
            "religion": other.religion or "",
            "habit": other.habit or {},
        })

    matches.sort(key = lambda item: item["similarity"], reverse= True)

    return {
        "user_id" : user_id,
        "match_count": len(matches[:limit]),
        "matches": matches[:limit],
    }

