from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas.chat import (
    ConversationListResponse,
    ConversationResponse,
    MessageCreate,
    MessageListResponse,
    MessageResponse,
)
from app.services.swipe import check_mutual_like

router = APIRouter(prefix="/chat", tags=["chat"])


def ordered_pair(user_id: str, other_user_id: str) -> tuple[str, str]:
    return tuple(sorted([user_id, other_user_id]))


def user_is_participant(conversation: Conversation, user_id: str) -> bool:
    return user_id in {conversation.user_one_id, conversation.user_two_id}


def get_other_user(conversation: Conversation, current_user_id: str) -> User:
    if conversation.user_one_id == current_user_id:
        return conversation.user_two
    return conversation.user_one


def get_last_message(conversation: Conversation) -> Message | None:
    return conversation.messages[-1] if conversation.messages else None


def build_match_context(current_user: User, other_user: User) -> tuple[list[str], list[str], str]:
    current_artist_names = {artist.name for artist in current_user.artists if artist.name}
    other_artist_names = {artist.name for artist in other_user.artists if artist.name}
    current_track_titles = {track.title for track in current_user.tracks if track.title}
    other_track_titles = {track.title for track in other_user.tracks if track.title}

    shared_artists = sorted(current_artist_names & other_artist_names)
    shared_tracks = sorted(current_track_titles & other_track_titles)

    if shared_tracks:
        reason = f"You both connect with songs like {', '.join(shared_tracks[:2])}"
    elif shared_artists:
        reason = f"You both have artists like {', '.join(shared_artists[:2])} in common"
    else:
        reason = "Matched through shared music energy"

    return shared_artists, shared_tracks, reason


def build_conversation_response(
    conversation: Conversation,
    current_user_id: str,
) -> ConversationResponse:
    other_user = get_other_user(conversation, current_user_id)
    current_user = conversation.user_one if conversation.user_one_id == current_user_id else conversation.user_two
    last_message = get_last_message(conversation)
    shared_artists, shared_tracks, match_reason = build_match_context(
        current_user,
        other_user,
    )

    return ConversationResponse(
        id=conversation.id,
        other_user_id=other_user.id,
        other_user_name=other_user.name,
        other_user_bio=other_user.bio or "",
        other_user_location_city=other_user.location_city or "",
        shared_artists=shared_artists,
        shared_tracks=shared_tracks,
        match_reason=match_reason,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        last_message=last_message,
    )


@router.post(
    "/conversations/{matched_user_id}",
    response_model=ConversationResponse,
    status_code=201,
)
def open_conversation(
    matched_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if matched_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="cannot chat with yourself")

    matched_user = db.query(User).filter(User.id == matched_user_id).first()
    if not matched_user:
        raise HTTPException(status_code=404, detail="matched user not found")

    if not check_mutual_like(current_user.id, matched_user_id, db):
        raise HTTPException(
            status_code=403,
            detail="conversation can only be opened after a mutual match",
        )

    user_one_id, user_two_id = ordered_pair(current_user.id, matched_user_id)
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.user_one_id == user_one_id,
            Conversation.user_two_id == user_two_id,
        )
        .first()
    )

    if not conversation:
        conversation = Conversation(user_one_id=user_one_id, user_two_id=user_two_id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    return build_conversation_response(conversation, current_user.id)


@router.get("/conversations", response_model=ConversationListResponse)
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversations = (
        db.query(Conversation)
        .filter(
            or_(
                Conversation.user_one_id == current_user.id,
                Conversation.user_two_id == current_user.id,
            )
        )
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return {
        "conversation_count": len(conversations),
        "conversations": [
            build_conversation_response(conversation, current_user.id)
            for conversation in conversations
        ],
    }


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=MessageListResponse,
)
def get_messages(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="conversation not found")
    if not user_is_participant(conversation, current_user.id):
        raise HTTPException(status_code=403, detail="not allowed")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
        .all()
    )

    return {
        "conversation_id": conversation_id,
        "message_count": len(messages),
        "messages": messages,
    }


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
def send_message(
    conversation_id: str,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation).filter(Conversation.id == conversation_id).first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="conversation not found")
    if not user_is_participant(conversation, current_user.id):
        raise HTTPException(status_code=403, detail="not allowed")

    content = data.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="message cannot be empty")

    message = Message(
        conversation_id=conversation.id,
        sender_id=current_user.id,
        content=content,
    )
    conversation.updated_at = datetime.now(timezone.utc)

    db.add(message)
    db.commit()
    db.refresh(message)

    return message
