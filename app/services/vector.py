import logging

from sentence_transformers import SentenceTransformer
import numpy as np
from sqlalchemy.orm import Session

from app.database import SessionLocal

logger = logging.getLogger("vibematch.vector")

_model = None
MODEL_NAME = "all-MiniLM-L6-v2"
VECTOR_DIM = 384  # all-MiniLM-L6-v2 output size


def get_model():
    global _model
    if _model is None:
        try:
            _model = SentenceTransformer(MODEL_NAME)
        except Exception:
            _model = SentenceTransformer(MODEL_NAME, local_files_only=True)#used chashed file if internet isnt working
    return _model


def build_music_text(user):
    """
    Convert a user's saved artists and tracks into one text string.
    This text is later turned into an embedding vector.
    """
    artists = user.artists or []
    tracks = user.tracks or []

    if not artists and not tracks:
        return ""

    artist_names = [artist.name for artist in artists if artist.name]

    all_tags = []
    for artist in artists:
        if artist.tags and isinstance(artist.tags, list):
            all_tags.extend(artist.tags)

    unique_tags = list(dict.fromkeys(all_tags))[:25]
    track_titles = [track.title for track in tracks if track.title]
    track_artists = list(
        dict.fromkeys(track.artist_name for track in tracks if track.artist_name)
    )

    parts = []

    if artist_names:
        parts.append(f"Favorite artists: {', '.join(artist_names)}")

    if track_titles:
        parts.append(f"Favorite songs: {', '.join(track_titles)}")

    if track_artists:
        parts.append(f"Songs selected from artists: {', '.join(track_artists)}")

    if unique_tags:
        parts.append(f"Genres and styles: {', '.join(unique_tags)}")

    return ". ".join(parts) + "."


def encode_text(text: str) -> list[float]:
    if not text.strip():
        return []

    model = get_model()
    vector = model.encode(text, normalize_embeddings=True)
    return vector.tolist()


def build_and_save_vector(user, db: Session) -> list[float]:
    music_text = build_music_text(user)

    if not music_text.strip():
        user.music_vector = []
        db.commit()
        db.refresh(user)
        return []

    vector = encode_text(music_text)
    user.music_vector = vector
    db.commit()
    db.refresh(user)
    return vector


def rebuild_vector_for_user_id(user_id: str) -> None:
    """Background-task entrypoint: uses its own session + re-fetches the user.

    Never pass a request-scoped Session or detached ORM object into
    BackgroundTasks — the request session may be closed by the time the
    task runs, and sharing sessions across threads is unsafe.
    """
    from app.models.user import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return
        build_and_save_vector(user, db)
    except Exception:
        logger.exception("vector rebuild failed for user %s", user_id)
    finally:
        db.close()


def cosine_similarity(vec_a: list, vec_b: list) -> float:
    if not vec_a or not vec_b:
        return 0.0

    try:
        a = np.array(vec_a, dtype=float)
        b = np.array(vec_b, dtype=float)
    except (TypeError, ValueError):
        return 0.0
    if a.shape != b.shape or a.ndim != 1 or a.shape[0] == 0:
        return 0.0
    denom = float(np.linalg.norm(a) * np.linalg.norm(b))
    if not denom:
        return 0.0
    return float(np.dot(a, b) / denom)


def shared_display_names(own_items: list[str | None], other_items: list[str | None]) -> list[str]:
    """
    Case-insensitive intersection of two name/title lists.

    IDs are never compared in matching — only names and titles — but old
    seed data ("SICKO MODE", "goosebumps") and new API data ("Sicko Mode",
    "Goosebumps") differ in casing. Comparing exact strings would miss
    real overlap, so match on stripped-lowercase keys while displaying
    the viewer's own original casing.
    """
    other_by_key: dict[str, str] = {}
    for item in other_items:
        if item and item.strip():
            other_by_key.setdefault(item.strip().lower(), item)

    shared: list[str] = []
    seen: set[str] = set()
    for item in own_items:
        if not item or not item.strip():
            continue
        key = item.strip().lower()
        if key in other_by_key and key not in seen:
            seen.add(key)
            shared.append(item.strip())

    return sorted(shared)