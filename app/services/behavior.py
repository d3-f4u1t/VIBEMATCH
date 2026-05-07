from sqlalchemy.orm import Session

from app.models.swipe import Swipe, SwipeAction


def build_behavior_summary(user_id: str, db: Session) -> dict:
    swipes_made = db.query(Swipe).filter(Swipe.swiper_id == user_id).all()
    swipes_received = db.query(Swipe).filter(Swipe.swiped_user_id == user_id).all()

    like_count = sum(1 for swipe in swipes_made if swipe.action == SwipeAction.LIKE)
    pass_count = sum(1 for swipe in swipes_made if swipe.action == SwipeAction.PASS)

    super_like_count = sum(
        1 for swipe in swipes_made if swipe.action == SwipeAction.SUPER_LIKE
    )

    total_swipes = len(swipes_made)

    received_like_count = sum(
        1 for swipe in swipes_received if swipe.action == SwipeAction.LIKE
    )

    mutual_match_count = 0

    liked_by_user = {
        swipe.swiped_user_id 
        for swipe in swipes_made 
        if swipe.action == SwipeAction.LIKE
    }

    liked_you = {
        swipe.swiper_id 
        for swipe in swipes_received 
        if swipe.action == SwipeAction.LIKE
    }

    mutual_match_count = len(liked_by_user & liked_you)
    like_rate = round(like_count / total_swipes, 4) if total_swipes else 0.0
    super_like_rate = round(super_like_count / total_swipes, 4) if total_swipes else 0.0
    selectivity_score = round((pass_count / total_swipes), 4) if total_swipes else 0.0

    return {
        "user_id": user_id,
        "total_swipes": total_swipes,
        "like_count": like_count,
        "pass_count": pass_count,
        "super_like_count": super_like_count,
        "like_rate": like_rate,
        "super_like_rate": super_like_rate,
        "received_like_count": received_like_count,
        "mutual_match_count": mutual_match_count,
        "selectivity_score": selectivity_score,
    }


def build_behavior_vector(user_id: str, db: Session) -> dict:
    summary = build_behavior_summary(user_id, db)

    feature_names = [
        "like_rate",
        "super_like_rate",
        "selectivity_score",
        "received_like_count",
        "mutual_match_count",
        "total_swipes",
    ]

    total_swipes = summary["total_swipes"]

    # Keep count-based features bounded so the first behavior vector stays stable.
    received_like_score = round(min(summary["received_like_count"] / 10, 1.0), 4)
    mutual_match_score = round(min(summary["mutual_match_count"] / 10, 1.0), 4)
    activity_score = round(min(total_swipes / 20, 1.0), 4)

    vector = [
        summary["like_rate"],
        summary["super_like_rate"],
        summary["selectivity_score"],
        received_like_score,
        mutual_match_score,
        activity_score,
    ]

    return {
        "user_id": user_id,
        "feature_names": feature_names,
        "vector": vector,
    }
