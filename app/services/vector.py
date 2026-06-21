from sentence_transformers import SentenceTransformer
import numpy as np
from sqlalchemy.orm import Session

_model = None
MODEL_NAME = "all-MiniLM-L6-v2"


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


def cosine_similarity(vec_a: list, vec_b: list) -> float:
    if not vec_a or not vec_b:
        return 0.0

    a = np.array(vec_a)
    b = np.array(vec_b)
    return float(np.dot(a, b))