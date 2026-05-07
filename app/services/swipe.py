from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models.swipe import Swipe, SwipeAction
from app.models.user import User
from app.services.vector import cosine_similarity
from app.schemas.swipe import SwipeHistoryItem, NextMatchResponse


def create_or_update_swipe(
    swiper_id: str,
    swiped_user_id: str,
    action: SwipeAction,
    db: Session
) -> Swipe:
    """
    Create a new swipe or update existing one (idempotent)
    If user already swiped on this person, update the action instead of creating duplicate
    """
    # Check if swipe already exists
    existing_swipe = (
        db.query(Swipe)
        .filter(
            and_(
                Swipe.swiper_id == swiper_id,
                Swipe.swiped_user_id == swiped_user_id
            )
        )
        .first()
    )

    if existing_swipe:
        # Update existing swipe
        existing_swipe.action = action
        db.commit()
        db.refresh(existing_swipe)
        return existing_swipe
    
    # Create new swipe
    new_swipe = Swipe(
        swiper_id=swiper_id,
        swiped_user_id=swiped_user_id,
        action=action
    )
    db.add(new_swipe)
    db.commit()
    db.refresh(new_swipe)
    return new_swipe


def get_swipe_history(user_id: str, db: Session, limit: int = 50) -> list[dict]:
    """
    Get all swipes a user has made, with target user info
    """
    swipes = (
        db.query(Swipe)
        .filter(Swipe.swiper_id == user_id)
        .order_by(Swipe.created_at.desc())
        .limit(limit)
        .all()
    )

    history = []
    for swipe in swipes:
        swiped_user = db.query(User).filter(User.id == swipe.swiped_user_id).first()
        if swiped_user:
            history.append(
                SwipeHistoryItem(
                    id=swipe.id,
                    swiped_user_id=swipe.swiped_user_id,
                    name=swiped_user.name,
                    action=swipe.action,
                    created_at=swipe.created_at
                )
            )
    
    return history


def get_users_already_swiped(user_id: str, db: Session) -> set[str]:
    """
    Get set of all user IDs that this user has already swiped on
    Used to filter out users in next-match
    """
    swiped = (
        db.query(Swipe.swiped_user_id)
        .filter(Swipe.swiper_id == user_id)
        .all()
    )
    return {row[0] for row in swiped}


def get_next_match(user_id: str, db: Session) -> dict | None:
    """
    Get the next user to swipe on based on:
    if the user Hasn't already been swiped on by this user
    Has minimum profile requirements (artists & tracks)
    Has a music vector
    Sorted by similarity score (highest first)
    Returns the best remaining match
    """
    # Get current user
    current_user = db.query(User).filter(User.id == user_id).first()
    if not current_user:
        return None
    
    if not current_user.music_vector:
        return None
    
    if len(current_user.artists) < 3 or len(current_user.tracks) < 4:
        return None
    
    # Get users already swiped
    already_swiped = get_users_already_swiped(user_id, db)

    current_user_artist_names = {artist.name for artist in current_user.artists if artist.name}
    current_user_track_titles = {track.title for track in current_user.tracks if track.title}
    
    # Get all eligible candidates
    candidates = []
    all_users = db.query(User).filter(User.id != user_id).all()
    
    for other_user in all_users:
        # Skip if already swiped
        if other_user.id in already_swiped:
            continue
        
        # Skip if no vector
        if not other_user.music_vector:
            continue
        
        # Skip if insufficient profile
        if len(other_user.artists) < 3 or len(other_user.tracks) < 4:
            continue
        
        # Calculate similarity
        similarity = cosine_similarity(current_user.music_vector, other_user.music_vector)

        # Get shared data
        other_user_artist_names = {artist.name for artist in other_user.artists if artist.name}
        other_user_track_titles = {track.title for track in other_user.tracks if track.title}
        
        shared_artists = sorted(current_user_artist_names & other_user_artist_names)
        shared_tracks = sorted(current_user_track_titles & other_user_track_titles)
        
        # Build match reason
        match_reason = _build_match_reason(shared_artists, shared_tracks, similarity)
        
        candidates.append({
            "user_id": other_user.id,
            "name": other_user.name,
            "bio": other_user.bio or "",
            "location_city": other_user.location_city or "",
            "artist_count": len(other_user.artists),
            "track_count": len(other_user.tracks),
            "similarity": round(similarity, 4),
            "shared_artists": shared_artists,
            "shared_tracks": shared_tracks,
            "match_reason": match_reason,
        })
    
    # Return highest similarity match
    if candidates:
        best_match = max(candidates, key=lambda x: x["similarity"])
        return best_match
    
    return None


def _build_match_reason(shared_artists: list[str], shared_tracks: list[str], similarity: float) -> str:
    """Helper to build human-readable match reason"""
    if shared_tracks:
        return f"You both connect with songs like {', '.join(shared_tracks[:2])}"
    if shared_artists:
        return f"Strong overlap in artists like {', '.join(shared_artists[:2])}"
    if similarity >= 0.8:
        return "Very strong music taste compatibility"
    if similarity >= 0.6:
        return "Good music taste compatibility"
    return "Some overlap in music taste"


def check_mutual_like(user_id_1: str, user_id_2: str, db: Session) -> bool:
    """
    Check if two users have both liked each other
    Returns True only if both have LIKE action
    """
    swipe_1_to_2 = (
        db.query(Swipe)
        .filter(
            and_(
                Swipe.swiper_id == user_id_1,
                Swipe.swiped_user_id == user_id_2,
                Swipe.action == SwipeAction.LIKE
            )
        )
        .first()
    )
    
    swipe_2_to_1 = (
        db.query(Swipe)
        .filter(
            and_(
                Swipe.swiper_id == user_id_2,
                Swipe.swiped_user_id == user_id_1,
                Swipe.action == SwipeAction.LIKE
            )
        )
        .first()
    )
    
    return swipe_1_to_2 is not None and swipe_2_to_1 is not None


def get_mutual_likes(user_id: str, db: Session) -> list[dict]:
    """
    Get all users that have mutual LIKE with current user
    """
    # Get all users who liked current user
    likes_received = (
        db.query(Swipe)
        .filter(
            and_(
                Swipe.swiped_user_id == user_id,
                Swipe.action == SwipeAction.LIKE
            )
        )
        .all()
    )
    
    mutual_matches = []
    for swipe_received in likes_received:
        swiper = db.query(User).filter(User.id == swipe_received.swiper_id).first()
        if not swiper:
            continue
        
        # Check if current user also liked back the swiped user
        if check_mutual_like(user_id, swiper.id, db):
            mutual_matches.append({
                "user_id": swiper.id,
                "name": swiper.name,
                "bio": swiper.bio or "",
                "location_city": swiper.location_city or "",
                "matched_at": swipe_received.created_at
            })
    
    return mutual_matches
