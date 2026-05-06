from pydantic import BaseModel
from datetime import datetime
from app.models.swipe import SwipeAction


class SwipeCreate(BaseModel):
    """Request body for creating a swipe"""
    swiped_user_id: str
    action: SwipeAction


class SwipeResponse(BaseModel):
    """Response model for a single swipe"""
    id: str
    swiper_id: str
    swiped_user_id: str
    action: SwipeAction
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SwipeHistoryItem(BaseModel):
    """Item in swipe history"""
    id: str
    swiped_user_id: str
    name: str
    action: SwipeAction
    created_at: datetime


class SwipeHistoryResponse(BaseModel):
    """Response for swipe history"""
    user_id: str
    total_swipes: int
    swipes: list[SwipeHistoryItem]


class NextMatchResponse(BaseModel):
    """Response for next match to swipe on"""
    user_id: str
    name: str
    bio: str
    location_city: str
    artist_count: int
    track_count: int
    similarity: float
    shared_artists: list[str]
    shared_tracks: list[str]
    match_reason: str
