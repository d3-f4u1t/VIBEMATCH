from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.auth import get_current_user
from app.schemas.swipe import SwipeCreate, SwipeResponse, SwipeHistoryResponse, NextMatchResponse
from app.services.swipe import (
    create_or_update_swipe,
    get_swipe_history,
    get_next_match,
    get_mutual_likes,
)

router = APIRouter(prefix="/swipe", tags=["swipe"])


@router.post("/", response_model=SwipeResponse, status_code=201)
def create_swipe(
    swipe_data: SwipeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update a swipe on another user
    
    swiped_user_id: ID of user being swiped on
    set Hardcoded returns such as LIKE, PASS, or SUPER_LIKE
    
    If user already swiped on this person, the action will be updated
    """
    if not current_user.music_vector:
        raise HTTPException(
            status_code= 400,
            detail="Complete your music profile before swiping"
        )
    
    if len(current_user.artists) < 3 or len(current_user.tracks) < 4:
        raise HTTPException(
            status_code= 400,
            detail="Complete your music profile before swiping"
        )
    
    # Validate that swiped user exists
    swiped_user = db.query(User).filter(User.id == swipe_data.swiped_user_id).first()
    if not swiped_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Prevent self-swiping
    if swipe_data.swiped_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot swipe on yourself")

    if not swiped_user.music_vector:
        raise HTTPException(
            status_code=400,
            detail="Target user does not have a complete music profile"
        )
    
    if len(swiped_user.artists) < 3 or len(swiped_user.tracks) < 4:
        raise HTTPException(
            status_code=400,
            detail="Target user does not have a complete music profile"
        )
    
    # Create or update swipe
    swipe = create_or_update_swipe(
        swiper_id=current_user.id,
        swiped_user_id=swipe_data.swiped_user_id,
        action=swipe_data.action,
        db=db
    )
    
    return swipe


@router.get("/history/{user_id}", response_model=SwipeHistoryResponse)
def get_history(

    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50
):
    """
    Get swipe history for a user
    Returns all swipes they made  with target user infois  sorted by most recent
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="not allowed")

    # Validate user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    history = get_swipe_history(user_id, db, limit)
    
    return {
        "user_id": user_id,
        "total_swipes": len(history),
        "swipes": history
    }


@router.get("/next/{user_id}", response_model=NextMatchResponse)
def get_next(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the next user to swipe on
    
    Returns the highest similarity match that hasn't been swiped yet
    just music vectors for now
    Automatically excludes:
    Users already swiped on
    without music vectors
    with incomplete profiles
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="not allowed")

    # Validate user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if current user has completed profile
    if not user.music_vector:
        raise HTTPException(
            status_code=400,
            detail="User has no music vector yet"
        )
    
    if len(user.artists) < 3 or len(user.tracks) < 4:
        raise HTTPException(
            status_code=400,
            detail="User must complete the music profile before getting matches"
        )
    
    # Get next match
    next_match = get_next_match(user_id, db)
    
    if not next_match:
        raise HTTPException(
            status_code=404,
            detail="No more matches available"
        )
    
    return next_match


@router.get("/mutual/{user_id}", response_model=dict)
def get_mutual(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all users that have mutual LIKE connection with this user
    
    A match only happens when both the users like each other 
    super_like is a base booster for likes and it improves visibility for the swiping user
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="not allowed")

    # Validate user exists
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    mutual_matches = get_mutual_likes(user_id, db)
    
    return {
        "user_id": user_id,
        "mutual_match_count": len(mutual_matches),
        "matches": mutual_matches
    }
