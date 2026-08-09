from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    conversation_id: str
    sender_id: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    id: str
    other_user_id: str
    other_user_name: str
    other_user_bio: str
    other_user_location_city: str
    shared_artists: list[str] = []
    shared_tracks: list[str] = []
    match_reason: str = ""
    created_at: datetime
    updated_at: datetime
    last_message: MessageResponse | None = None


class ConversationListResponse(BaseModel):
    conversation_count: int
    conversations: list[ConversationResponse]


class MessageListResponse(BaseModel):
    conversation_id: str
    message_count: int
    messages: list[MessageResponse]
