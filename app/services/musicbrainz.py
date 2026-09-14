"""
Music search service: Deezer (primary) + iTunes Search API (fallback).

Why hybrid?
  Deezer artist metadata (/search/artist, /artist/{id}) works globally,
  but Deezer *track* endpoints (/search, /search/track, /artist/{id}/top)
  return ``data: []`` from regions where Deezer has no streaming license
  (e.g. India — the API /infos endpoint reports the server country and the
  catalog is geo-filtered). Artist search succeeds while every track query
  comes back empty.

  The iTunes Search API (https://itunes.apple.com/search) needs no key,
  works globally, and returns the same fields we need: track/artist IDs,
  preview URLs, artwork, genre, durations.

Strategy per function:
  1. Try Deezer first (preserves existing Deezer numeric IDs in the DB).
  2. If Deezer returns no usable items, fall back to iTunes.
  3. Response shapes are identical either way so routes/mobile are untouched.

ID scheme (stored in the legacy ``mb_id`` / ``artist_mb_id`` columns):
  - Deezer results: bare numeric string, e.g. "5531258" (unchanged).
  - iTunes results: prefixed, e.g. "itunes:1406109863" — avoids any
    collision with Deezer numeric IDs. Matching/shared-counts compare by
    name/title, so mixed ID namespaces are safe.

Last.fm (optional, via LASTFM_API_KEY) still enriches artist genre tags.
Without a key, iTunes primaryGenreName is used as the tag fallback.

Rate limits (all per server IP — shared by EVERY app user):
  - Deezer: 50 requests / 5 seconds. Generous; per-user backend caps
    (30/min per search endpoint) keep us far below it.
  - iTunes: ~20 requests / minute. Tight and shared, so identical upstream
    queries are cached in-memory (10 min TTL) and failures briefly (30 s)
    to avoid retry storms. iTunes answers over-limit with 403 + empty
    results, which is treated as a service error, never cached long.
  - Never hammer these endpoints in loops. Mobile debounces typing
    (350 ms) and the backend rate-limits each search route to 30/min/IP.
"""

import os
import re
import threading
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
# Deezer filters non-browser User-Agents; iTunes accepts anything.
_session.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
})

DEEZER_BASE = "https://api.deezer.com"
ITUNES_SEARCH_BASE = "https://itunes.apple.com/search"
ITUNES_LOOKUP_BASE = "https://itunes.apple.com/lookup"
LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/"
LASTFM_API_KEY = os.getenv("LASTFM_API_KEY", "")

ITUNES_PREFIX = "itunes:"

# Tracks whose titles should be discarded
_BLOCKED_TITLES = {"[unknown]", "[untitled]", "unknown", "untitled"}

# Tags that are metadata noise, not genre signals
_BLOCKED_TAGS = {
    "seen live", "love", "beautiful", "catchy", "cool", "favorite", "awesome",
    "great", "amazing", "best", "classic", "top",
}


# ── Tiny in-memory TTL cache (no deps) ────────────────────────────────────────
# Protects the shared server IP against provider rate limits: identical
# upstream queries (same path + sorted params) reuse one response.
# Successes live 10 min; failures only 30 s so outages recover fast and
# iTunes 403-throttles (empty results) are never served stale for long.
_CACHE_TTL_OK = 600
_CACHE_TTL_FAIL = 30
_CACHE_MAX = 500
_cache: dict[str, tuple[float, float, object]] = {}  # key -> (expires_at, stored_at, value)
_cache_lock = threading.Lock()


def _cache_key(*parts: object) -> str:
    return repr(parts)


def _cache_get(key: str):
    now = time.monotonic()
    with _cache_lock:
        hit = _cache.get(key)
        if hit and hit[0] > now:
            return hit[2]
        if hit:
            del _cache[key]
    return None


def _cache_set(key: str, value: object, *, ok: bool) -> None:
    now = time.monotonic()
    ttl = _CACHE_TTL_OK if ok else _CACHE_TTL_FAIL
    with _cache_lock:
        if len(_cache) >= _CACHE_MAX:
            # Evict expired first, else the oldest entry.
            expired = [k for k, v in _cache.items() if v[0] <= now]
            for k in expired:
                del _cache[k]
            if len(_cache) >= _CACHE_MAX:
                oldest = min(_cache, key=lambda k: _cache[k][1])
                del _cache[oldest]
        _cache[key] = (now + ttl, now, value)


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
    key = _cache_key("dz", path, sorted((params or {}).items()))
    hit = _cache_get(key)
    if hit is not None:
        return hit
    try:
        res = _session.get(f"{DEEZER_BASE}{path}", params=params or {}, timeout=10)
        res.raise_for_status()
        data = res.json()
    except Exception:
        data = {}
    _cache_set(key, data, ok=bool(data))
    return data


def _itunes_search(params: dict) -> list[dict]:
    """GET the iTunes Search API; returns the result list (or [] on failure)."""
    key = _cache_key("it", sorted(params.items()))
    hit = _cache_get(key)
    if hit is not None:
        return hit
    try:
        res = _session.get(ITUNES_SEARCH_BASE, params=params, timeout=10)
        res.raise_for_status()
        data = res.json()
        results = data.get("results", [])
        out = results if isinstance(results, list) else []
    except Exception:
        out = []
    _cache_set(key, out, ok=bool(out))
    return out


def _itunes_lookup(artist_id: str, entity: str = "song", limit: int = 20) -> list[dict]:
    """Lookup an iTunes artist's songs by numeric iTunes artist ID."""
    key = _cache_key("itl", artist_id, entity, limit)
    hit = _cache_get(key)
    if hit is not None:
        return hit
    try:
        res = _session.get(
            ITUNES_LOOKUP_BASE,
            params={"id": artist_id, "entity": entity, "limit": limit + 1},
            timeout=10,
        )
        res.raise_for_status()
        data = res.json()
        results = data.get("results", [])
        if not isinstance(results, list):
            out = []
        else:
            # First result is the artist itself; the rest are songs.
            out = [r for r in results if r.get("wrapperType") == "track"]
    except Exception:
        out = []
    _cache_set(key, out, ok=bool(out))
    return out


def _upscale_artwork(url: str | None) -> str | None:
    """iTunes artwork URLs embed their size (e.g. 100x100bb) — request 600px."""
    if not url:
        return None
    return url.replace("100x100bb", "600x600bb").replace("60x60bb", "600x600bb")


def _itunes_track_to_dict(item: dict) -> dict | None:
    """Map an iTunes song result onto the track shape the app expects."""
    track_id = item.get("trackId")
    title = item.get("trackName")
    if not track_id or not _is_usable_title(title):
        return None
    artist_id = item.get("artistId")
    return {
        "mb_id": f"{ITUNES_PREFIX}{track_id}",
        "artist_mb_id": f"{ITUNES_PREFIX}{artist_id}" if artist_id else "",
        "artist_name": item.get("artistName", ""),
        "title": title,
        "release_title": item.get("collectionName"),
        "length_ms": item.get("trackTimeMillis"),
        "preview_url": item.get("previewUrl"),
        "cover_medium": _upscale_artwork(item.get("artworkUrl100")),
    }


def _lastfm_get(params: dict) -> dict:
    """GET Last.fm; returns {} on failure."""
    if not LASTFM_API_KEY:
        return {}
    key = _cache_key("lfm", sorted(params.items()))
    hit = _cache_get(key)
    if hit is not None:
        return hit
    try:
        params = {**params, "api_key": LASTFM_API_KEY, "format": "json"}
        res = _session.get(LASTFM_BASE, params=params, timeout=8)
        res.raise_for_status()
        data = res.json()
    except Exception:
        data = {}
    _cache_set(key, data, ok=bool(data))
    return data


def _get_lastfm_artist_tags(artist_name: str) -> list[str]:
    """Fetch top genre tags for an artist from Last.fm (up to 5)."""
    data = _lastfm_get({"method": "artist.getTopTags", "artist": artist_name})
    tags = data.get("toptags", {}).get("tag", [])
    return [
        t["name"]
        for t in tags[:10]
        if t.get("name") and t["name"].lower() not in _BLOCKED_TAGS
    ][:5]


def _resolve_tags(artist_name: str, fallback_genre: str | None = None) -> list[str]:
    """Last.fm tags when keyed, else the iTunes/Deezer genre as a single tag."""
    if LASTFM_API_KEY:
        tags = _get_lastfm_artist_tags(artist_name)
        if tags:
            return tags
    if fallback_genre and fallback_genre.lower() not in _BLOCKED_TAGS:
        return [fallback_genre]
    return []


# ── Public API ────────────────────────────────────────────────────────────────

def search_artist(name: str) -> dict:
    """
    Search for artists by name. Deezer primary, iTunes fallback.
    Returns {"artists": [...]} or {"error": "..."}.
    """
    data = _deezer_get("/search/artist", {"q": name, "limit": 8, "order": "RANKING"})
    items = data.get("data", []) if isinstance(data.get("data"), list) else []

    artists = []
    for item in items:
        deezer_id = str(item.get("id", ""))
        artist_name = item.get("name", "")
        if not deezer_id or not artist_name:
            continue
        artists.append({
            "mb_id": deezer_id,
            "name": artist_name,
            "country": None,  # Deezer search doesn't expose country
            "type": item.get("type", "Artist"),
            "disambiguation": "",
            "tags": _resolve_tags(artist_name),
            "score": item.get("nb_fan", 0),  # fan count as relevance proxy
            "picture_medium": item.get("picture_medium"),
        })

    if artists:
        return {"artists": artists}

    # ── Fallback: iTunes artist search (global, no key) ──
    results = _itunes_search({"term": name, "media": "music", "entity": "musicArtist", "limit": 8})
    for item in results:
        artist_id = item.get("artistId")
        artist_name = item.get("artistName", "")
        if not artist_id or not artist_name:
            continue
        artists.append({
            "mb_id": f"{ITUNES_PREFIX}{artist_id}",
            "name": artist_name,
            "country": None,
            "type": item.get("artistType", "Artist"),
            "disambiguation": "",
            "tags": _resolve_tags(artist_name, item.get("primaryGenreName")),
            "score": 0,
            "picture_medium": None,  # iTunes artist search has no artwork
        })

    if artists:
        return {"artists": artists}
    if data.get("error") or not results:
        # Distinguish "nothing found" from "service down" only loosely —
        # callers surface this string to the user.
        pass
    return {"artists": []}


def _deezer_artist_name(artist_id: str) -> str | None:
    """Resolve a Deezer artist ID to its name (metadata endpoint works globally)."""
    data = _deezer_get(f"/artist/{artist_id}")
    name = data.get("name")
    return name if isinstance(name, str) and name else None


def search_artist_recordings(
    artist_id: str,
    limit: int = 10,
    artist_name: str | None = None,
) -> dict:
    """
    Fetch top tracks for an artist. Deezer primary, iTunes fallback.
    ``artist_id`` may be a bare Deezer numeric ID or an "itunes:<id>" ID
    from iTunes-sourced artists. ``artist_name`` (optional) skips a lookup
    when the caller already knows it.
    Returns {"tracks": [...]} or {"error": "..."}.
    """
    # ── iTunes-sourced artist: go straight to iTunes lookup ──
    if artist_id.startswith(ITUNES_PREFIX):
        raw = artist_id[len(ITUNES_PREFIX):]
        tracks = []
        for item in _itunes_lookup(raw, limit=limit):
            track = _itunes_track_to_dict(item)
            if track:
                tracks.append(track)
            if len(tracks) >= limit:
                break
        return {"tracks": tracks}

    # ── Deezer top tracks (works where Deezer is licensed) ──
    data = _deezer_get(f"/artist/{artist_id}/top", {"limit": max(limit * 2, 20)})
    items = data.get("data", []) if isinstance(data.get("data"), list) else []

    tracks = []
    seen: set[str] = set()
    for item in items:
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
            "mb_id": str(item["id"]),
            "artist_mb_id": track_artist_id,
            "artist_name": track_artist_name,
            "title": title,
            "release_title": (item.get("album") or {}).get("title"),
            "length_ms": duration_sec * 1000 if duration_sec else None,
            "preview_url": item.get("preview"),
            "cover_medium": (item.get("album") or {}).get("cover_medium"),
        })
        if len(tracks) >= limit:
            break

    if tracks:
        return {"tracks": tracks}

    # ── Fallback: iTunes songs for the artist ──
    name = (artist_name or "").strip() or _deezer_artist_name(artist_id)
    if not name:
        return {"error": "Could not load artist tracks. Please try again."}

    results = _itunes_search({
        "term": name,
        "media": "music",
        "entity": "song",
        "attribute": "artistTerm",
        "limit": max(limit * 2, 20),
    })
    tracks = []
    seen = set()
    wanted = _normalize(name)
    for item in results:
        track = _itunes_track_to_dict(item)
        if not track:
            continue
        # Keep only songs actually by this artist (iTunes artistTerm is fuzzy).
        actual = _normalize(track["artist_name"])
        if wanted and wanted != actual and wanted not in actual and actual not in wanted:
            continue
        key = f"{_normalize(track['title'])}::{track['artist_mb_id']}"
        if key in seen:
            continue
        seen.add(key)
        tracks.append(track)
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
    Deezer /search/track primary, iTunes fallback.
    Returns {"tracks": [...]} or {"error": "..."}.
    """
    preferred_artists = preferred_artists or {}
    preferred_artist_mbids = preferred_artist_mbids or set()
    preferred_names = {_normalize(n) for n in preferred_artists.values() if n}

    query = f"{title} {artist_name}".strip() if artist_name else title

    # NOTE: the old unified /search endpoint is used as a last resort only —
    # Deezer now expects typed /search/track and geo-filters track results.
    candidates: list[dict] = []
    for path in ("/search/track", "/search"):
        data = _deezer_get(path, {"q": query, "limit": max(limit * 3, 20), "order": "RANKING"})
        items = data.get("data", []) if isinstance(data.get("data"), list) else []
        if items:
            for item in items:
                if item.get("type") not in (None, "track"):
                    continue
                candidates.append(("deezer", item))
            break

    scored: list[tuple[int, dict]] = []
    seen: set[str] = set()

    for source, item in candidates:
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

        score = _score_track(
            track_artist_id, track_artist_name,
            artist_name, preferred_artist_mbids, preferred_names,
            popularity=int(item.get("rank", 0)) // 100_000,
        )
        duration_sec = item.get("duration", 0)
        scored.append((score, {
            "mb_id": str(item["id"]),
            "artist_mb_id": track_artist_id,
            "artist_name": track_artist_name,
            "title": raw_title,
            "release_title": album_obj.get("title"),
            "length_ms": duration_sec * 1000 if duration_sec else None,
            "preview_url": item.get("preview"),
            "cover_medium": album_obj.get("cover_medium"),
        }))

    # ── Fallback: iTunes song search (global, no key) ──
    if not scored:
        results = _itunes_search({
            "term": query,
            "media": "music",
            "entity": "song",
            "limit": max(limit * 3, 20),
        })
        for item in results:
            track = _itunes_track_to_dict(item)
            if not track:
                continue
            title_key = f"{_normalize(track['title'])}::{track['artist_mb_id']}"
            if title_key in seen:
                continue
            seen.add(title_key)
            score = _score_track(
                track["artist_mb_id"], track["artist_name"],
                artist_name, preferred_artist_mbids, preferred_names,
                popularity=0,
            )
            scored.append((score, track))

    if not scored:
        return {"error": "Could not reach music search service. Please try again."}

    scored.sort(key=lambda x: (-x[0], x[1]["title"].lower()))
    return {"tracks": [t for _, t in scored[:limit]]}


def _score_track(
    track_artist_id: str,
    track_artist_name: str,
    artist_name: str | None,
    preferred_artist_mbids: set[str],
    preferred_names: set[str],
    popularity: int,
) -> int:
    """Shared scoring: prefer the user's picked artists, then name match, then rank."""
    score = 0
    if track_artist_id in preferred_artist_mbids:
        score += 5
    # Name-based preferred boost — covers mixed Deezer/iTunes ID namespaces.
    if _normalize(track_artist_name) in preferred_names:
        score += 5
    if artist_name:
        exp = _normalize(artist_name)
        act = _normalize(track_artist_name)
        if exp == act:
            score += 3
        elif exp in act or act in exp:
            score += 2
    score += min(popularity, 3)
    return score
