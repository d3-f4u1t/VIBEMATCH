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
    Convert a user's saved artists and tracks + enrichment chips
    into one text string. This text is later turned into an embedding vector.
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

    # ── Enrichment chips (v1, optional, picked in mobile vibe step) ──
    moods = [m for m in (getattr(user, "music_moods", None) or []) if m]
    if moods:
        parts.append(f"Music moods: {', '.join(moods[:8])}")
    eras = [e for e in (getattr(user, "music_eras", None) or []) if e]
    if eras:
        parts.append(f"Favorite eras: {', '.join(eras[:8])}")
    energy = (getattr(user, "music_energy", None) or "").strip()
    if energy:
        parts.append(f"Energy level: {energy}")
    contexts = [c for c in (getattr(user, "music_contexts", None) or []) if c]
    if contexts:
        parts.append(f"Listening contexts: {', '.join(contexts[:8])}")

    return ". ".join(parts) + "."


def build_personality_text(user) -> str:
    """v1 personality text: bio only. Prompts plug in here later."""
    bio = (getattr(user, "bio", None) or "").strip()
    return bio


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

    # Personality vector v1: bio embedding, empty when no bio
    try:
        p_text = build_personality_text(user)
        user.personality_vector = encode_text(p_text) if p_text.strip() else []
    except Exception:
        user.personality_vector = []

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


# ── Weighted compatibility (v1, pre-launch) ──────────────────────────────
# identity  = music+personality similarity
# preference = explicit age/intent/dealbreaker/city fit, both directions
# behavior  = neutral 0.5 until 20+ swipes (ensemble post-launch)
DEFAULT_WEIGHTS = {"identity": 0.6, "preference": 0.25, "behavior": 0.15}

INTENT_OPEN_VALUES = {"open", "open_to_anything", "not_sure_yet", "", None}


def calculate_age(dob) -> int | None:
    if not dob:
        return None
    try:
        from datetime import date as _date
        today = _date.today()
        if hasattr(dob, "year"):
            return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
        return None
    except Exception:
        return None


def _norm_str(v) -> str:
    return (v or "").strip().lower()


def preference_fit_score(viewer, candidate) -> float:
    """0..1 explicit-preference fit of viewer -> candidate. Missing prefs = neutral."""
    scores: list[float] = []
    weights: list[float] = []

    # Age fit (0.4): candidate age within viewer [age_min, age_max]
    cand_age = calculate_age(getattr(candidate, "date_of_birth", None))
    v_min = getattr(viewer, "age_min", None)
    v_max = getattr(viewer, "age_max", None)
    if cand_age is not None and (v_min is not None or v_max is not None):
        lo = v_min if v_min is not None else 18
        hi = v_max if v_max is not None else 100
        scores.append(1.0 if lo <= cand_age <= hi else 0.0)
        weights.append(0.4)
    else:
        scores.append(0.5)
        weights.append(0.1)

    # Intent fit (0.3): same intent, or either open/None
    v_intent = _norm_str(getattr(viewer, "intent", None))
    c_intent = _norm_str(getattr(candidate, "intent", None))
    if not v_intent or not c_intent or v_intent in INTENT_OPEN_VALUES or c_intent in INTENT_OPEN_VALUES:
        scores.append(0.7)
    else:
        scores.append(1.0 if v_intent == c_intent else 0.2)
    weights.append(0.3)

    # Dealbreakers (0.2): viewer dealbreakers vs candidate habits
    dealbreakers = [d.strip().lower() for d in (getattr(viewer, "dealbreakers", None) or []) if d and d.strip()]
    if dealbreakers:
        c_habit = getattr(candidate, "habit", None) or {}
        if isinstance(c_habit, dict):
            bad = 0
            for d in dealbreakers:
                # dealbreaker "smoking" fails if candidate smokes socially/regularly/sometimes
                val = _norm_str(c_habit.get(d, ""))
                if val in {"regularly", "socially", "sometimes", "yes", "often"}:
                    bad += 1
            scores.append(0.0 if bad else 1.0)
        else:
            scores.append(0.7)
        weights.append(0.2)
    else:
        scores.append(0.7)
        weights.append(0.05)

    # City overlap (0.1 v1: same city string = 1.0, else 0.5 — GPS distance post-launch)
    v_city = _norm_str(getattr(viewer, "location_city", None))
    c_city = _norm_str(getattr(candidate, "location_city", None))
    if v_city and c_city:
        scores.append(1.0 if v_city == c_city else 0.5)
    else:
        scores.append(0.5)
    weights.append(0.1)

    total_w = sum(weights) or 1.0
    return float(sum(s * w for s, w in zip(scores, weights)) / total_w)


def passes_hard_filters(viewer, candidate) -> bool:
    """Hard reject before scoring: age range, intent clash, dealbreakers, tight city."""
    # Age hard filter
    cand_age = calculate_age(getattr(candidate, "date_of_birth", None))
    v_min = getattr(viewer, "age_min", None)
    v_max = getattr(viewer, "age_max", None)
    if cand_age is not None:
        if v_min is not None and cand_age < v_min:
            return False
        if v_max is not None and cand_age > v_max:
            return False

    # Intent hard filter: clash only when both specific and different, neither open
    v_intent = _norm_str(getattr(viewer, "intent", None))
    c_intent = _norm_str(getattr(candidate, "intent", None))
    if v_intent and c_intent and v_intent not in INTENT_OPEN_VALUES and c_intent not in INTENT_OPEN_VALUES:
        if v_intent != c_intent:
            return False

    # Dealbreaker hard filter
    dealbreakers = [d.strip().lower() for d in (getattr(viewer, "dealbreakers", None) or []) if d and d.strip()]
    if dealbreakers:
        c_habit = getattr(candidate, "habit", None) or {}
        if isinstance(c_habit, dict):
            for d in dealbreakers:
                if _norm_str(c_habit.get(d, "")) in {"regularly", "socially", "sometimes", "yes", "often"}:
                    return False

    # Distance v1: max_distance_km<=50 requires same city when both set
    max_d = getattr(viewer, "max_distance_km", None)
    if max_d is not None and max_d <= 50:
        v_city = _norm_str(getattr(viewer, "location_city", None))
        c_city = _norm_str(getattr(candidate, "location_city", None))
        if v_city and c_city and v_city != c_city:
            return False

    return True


def behavior_score(viewer, candidate, db=None) -> float:
    """Neutral 0.5 v1. Full behavior alignment after 20+ swipes (post-launch ensemble)."""
    try:
        if db is None:
            return 0.5
        from app.services.behavior import build_behavior_summary
        vs = build_behavior_summary(getattr(viewer, "id", ""), db)
        cs = build_behavior_summary(getattr(candidate, "id", ""), db)
        v_total = (vs.get("total_swipes") or 0) if isinstance(vs, dict) else 0
        c_total = (cs.get("total_swipes") or 0) if isinstance(cs, dict) else 0
        if v_total < 20 or c_total < 5:
            return 0.5
        v_rate = float(vs.get("like_rate") or 0.5)
        c_rate = float(cs.get("like_rate") or 0.5)
        return max(0.0, 1.0 - abs(v_rate - c_rate))
    except Exception:
        return 0.5


def compatibility_score(viewer, candidate, db=None, weights: dict | None = None) -> dict:
    """Weighted compatibility. `similarity` stays the user-facing total for API compat."""
    w = weights or DEFAULT_WEIGHTS
    music_sim = cosine_similarity(getattr(viewer, "music_vector", None), getattr(candidate, "music_vector", None))
    p_vec_a = getattr(viewer, "personality_vector", None) or []
    p_vec_b = getattr(candidate, "personality_vector", None) or []
    if p_vec_a and p_vec_b:
        pers_sim = cosine_similarity(p_vec_a, p_vec_b)
        identity = 0.7 * music_sim + 0.3 * pers_sim
    else:
        identity = music_sim
        pers_sim = 0.0
    pref_ab = preference_fit_score(viewer, candidate)
    pref_ba = preference_fit_score(candidate, viewer)
    preference = (pref_ab + pref_ba) / 2.0
    behavior = behavior_score(viewer, candidate, db)
    total = w["identity"] * identity + w["preference"] * preference + w["behavior"] * behavior
    total = max(0.0, min(1.0, float(total)))
    return {
        "total": round(total, 4),
        "identity": round(float(identity), 4),
        "music": round(float(music_sim), 4),
        "personality": round(float(pers_sim), 4),
        "preference": round(float(preference), 4),
        "pref_ab": round(float(pref_ab), 4),
        "pref_ba": round(float(pref_ba), 4),
        "behavior": round(float(behavior), 4),
    }


def build_match_reason_explainable(shared_artists, shared_tracks, comp: dict) -> str:
    total = comp.get("total", 0)
    parts = []
    if shared_tracks:
        parts.append(f"songs like {', '.join(shared_tracks[:2])}")
    if shared_artists:
        parts.append(f"artists like {', '.join(shared_artists[:2])}")
    base = f"You both connect with { ' and '.join(parts)}" if parts else (
        "Very strong music taste compatibility" if total >= 0.8 else
        "Good music taste compatibility" if total >= 0.6 else
        "Some overlap in music taste"
    )
    return f"{base} (music {comp.get('music',0):.2f} · vibe {comp.get('preference',0):.2f} · energy {comp.get('behavior',0):.2f})"


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