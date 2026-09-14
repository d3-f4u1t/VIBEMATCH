"""
Music search service powered by the Deezer API (no key required) with
optional Last.fm genre-tag enrichment.

Deezer:  https://api.deezer.com  — free, no key, ~50 req/min
Last.fm: https://ws.audioscrobbler.com/2.0/ — free key, generous limits

How IDs work:
  Artists and tracks now use Deezer's numeric ID (stored as a string) in
  the `mb_id` / `artist_mb_id` columns.  The DB schema is unchanged.
"""

import os
import re
import time

import requests as req
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# ── HTTP session with retry ────────────────────────────────────────────────────
_session = req.Session()
_retry = Retry(
    total=3,
    backoff_factor=0.5,
    status_forcelist=[429, 500, 502, 503, 504],
    allowed_methods=["GET"],
    raise_on_status=False,
)
_adapter = HTTPAdapter(max_retries=_retry)
_session.mount("https://", _adapter)
# Deezer requires a standard browser User-Agent — custom strings are filtered
_session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
})

DEEZER_BASE = "https://api.deezer.com"
LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/"
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "")

# Tracks whose titles should be discarded
_BLOCKED_TITLES = {"[unknown]", "[untitled]", "unknown", "untitled"}

# Tags that are metadata noise, not genre signals
_BLOCKED_TAGS = {
    "seen live", "love", "beautiful", "catchy", "cool", "favorite", "awesome",
    "great", "amazing", "best", "classic", "top",
}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9 ]+", "", text.lower()).strip()


def _is_usable_title(title: str | None) -> bool:
    if not title:
        return False
    n = _normalize(title)
    return bool(n) and n not in _BLOCKED_TITLES and not n.startswith("unknown")


def _deezer_get(path: str, params: dict | None = None) -> dict:
    """GET a Deezer endpoint; returns {} on failure instead of raising."""
    try:
        res = _session.get(f"{DEEZER_BASE}{path}", params=params or {}, timeout=10)
        res.raise_for_status()
        return res.json()
    except Exception:
        return {}


def _lastfm_get(params: dict) -> dict:
    """GET Last.fm; returns {} on failure."""
    if not LASTFM_API_KEY:
        return {}
    try:
        params = {**params, "api_key": LASTFM_API_KEY, "format": "json"}
        res = _session.get(LASTFM_BASE, params=params, timeout=8)
        res.raise_for_status()
        return res.json()
    except Exception:
        return {}


def _get_lastfm_artist_tags(artist_name: str) -> list[str]:
    """Fetch top genre tags for an artist from Last.fm (up to 5)."""
    data = _lastfm_get({"method": "artist.getTopTags", "artist": artist_name})
    tags = data.get("toptags", {}).get("tag", [])
    return [
        t["name"]
        for t in tags[:10]
        if t.get("name") and t["name"].lower() not in _BLOCKED_TAGS
    ][:5]


# ── Public API — mirroring the old musicbrainz.py surface ────────────────────

def search_artist(name: str) -> dict:
    """
    Search for artists by name using Deezer.
    Returns {"artists": [...]} or {"error": "..."}.
    Each artist dict has the same shape the rest of the app expects.
    """
    data = _deezer_get("/search/artist", {"q": name, "limit": 8})
    if not data or "data" not in data:
        return {"error": "Could not reach music search service. Please try again."}

    artists = []
    for item in data["data"]:
        deezer_id = str(item.get("id", ""))
        artist_name = item.get("name", "")
        if not deezer_id or not artist_name:
            continue

        # Enrich with Last.fm tags (best-effort, won't block if no key)
        tags = _get_lastfm_artist_tags(artist_name) if LASTFM_API_KEY else []

        artists.append({
            "mb_id": deezer_id,                           # stored as "mb_id" for compat
            "name": artist_name,
            "country": None,                              # Deezer doesn’t expose country in search
            "type": "Artist",
            "disambiguation": "",
            "tags": tags,
            "score": item.get("nb_fan", 0),               # fan count as relevance proxy
            "picture_medium": item.get("picture_medium"), # bonus: artist photo URL
        })

    return {"artists": artists}


def search_artist_recordings(artist_id: str, limit: int = 10) -> dict:
    """
    Fetch top tracks for a Deezer artist ID.
    Returns {"tracks": [...]} or {"error": "..."}.
    """
    # artist_id is now the Deezer numeric ID (stored as string)
    data = _deezer_get(f"/artist/{artist_id}/top", {"limit": max(limit * 2, 20)})
    if not data or "data" not in data:
        return {"error": "Could not load artist tracks. Please try again."}

    tracks = []
    seen: set[str] = set()

    for item in data["data"]:
        title = item.get("title")
        if not _is_usable_title(title):
            continue

        title_key = _normalize(title)
        if title_key in seen:
            continue
        seen.add(title_key)

        artist = item.get("artist") or {}
        track_artist_id = str(artist.get("id", artist_id))
        track_artist_name = artist.get("name", "")
        duration_sec = item.get("duration", 0)

        tracks.append({
            "mb_id": str(item["id"]),                     # Deezer track ID
            "artist_mb_id": track_artist_id,
            "artist_name": track_artist_name,
            "title": title,
            "release_title": (item.get("album") or {}).get("title"),
            "length_ms": duration_sec * 1000 if duration_sec else None,
            "preview_url": item.get("preview"),           # bonus: 30-sec preview
            "cover_medium": (item.get("album") or {}).get("cover_medium"),
        })

        if len(tracks) >= limit:
            break

    return {"tracks": tracks}


def search_tracks_by_title(
    title: str,
    artist_name: str | None = None,
    preferred_artists: dict[str, str] | None = None,
    preferred_artist_mbids: set[str] | None = None,
    limit: int = 10,
) -> dict:
    """
    Search for tracks by title (optionally filtered by artist name).
    Returns {"tracks": [...]} or {"error": "..."}.
    Uses Deezer /search (unified endpoint — most reliable).
    """
    preferred_artists = preferred_artists or {}
    preferred_artist_mbids = preferred_artist_mbids or set()

    # Build query: plain text works most reliably with Deezer
    query = f"{title} {artist_name}".strip() if artist_name else title

    data = _deezer_get("/search", {"q": query, "limit": max(limit * 3, 20)})

    if not data or "data" not in data:
        return {"error": "Could not reach music search service. Please try again."}

    scored: list[tuple[int, dict]] = []
    seen: set[str] = set()

    for item in data["data"]:
        # Deezer /search returns mixed types; skip non-track items
        if item.get("type") not in (None, "track"):
            continue

        raw_title = item.get("title") or item.get("title_short")
        if not _is_usable_title(raw_title):
            continue

        artist_obj = item.get("artist") or {}
        track_artist_id = str(artist_obj.get("id", ""))
        track_artist_name = artist_obj.get("name", "")
        album_obj = item.get("album") or {}
        title_key = f"{_normalize(raw_title)}::{track_artist_id}"

        if title_key in seen:
            continue
        seen.add(title_key)

        # Scoring: prefer tracks from the user’s selected artists
        score = 0
        if track_artist_id in preferred_artist_mbids:
            score += 5
        if artist_name:
            exp = _normalize(artist_name)
            act = _normalize(track_artist_name)
            if exp == act:
                score += 3
            elif exp in act or act in exp:
                score += 2
        # Boost by Deezer rank (popularity)
        score += min(int(item.get("rank", 0)) // 100_000, 3)

        duration_sec = item.get("duration", 0)

        scored.append((
            score,
            {
                "mb_id": str(item["id"]),
                "artist_mb_id": track_artist_id,
                "artist_name": track_artist_name,
                "title": raw_title,
                "release_title": album_obj.get("title"),
                "length_ms": duration_sec * 1000 if duration_sec else None,
                "preview_url": item.get("preview"),
                "cover_medium": album_obj.get("cover_medium"),
            },
        ))

    scored.sort(key=lambda x: (-x[0], x[1]["title"].lower()))
    return {"tracks": [t for _, t in scored[:limit]]}
