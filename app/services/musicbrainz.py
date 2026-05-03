import requests as request
import time
import re

base_url = "https://musicbrainz.org/ws/2/"

BLOCKED_TAGS = {
    "cotm candidate", "lesbian", "gay", "pedophilia",
    "relic inn", "rap us", "hardcore hip", "death by suicide",
    "death by overdose", "death by amitriptyline"
}

BLOCKED_TRACK_TITLES = {
    "[unknown]",
    "[untitled]",
    "unknown",
    "untitled",
}

def clean_tags(tags: list) -> list:
    return[
        t["name"] for t in tags
        if t["count"] > 5
        and t["name"] not in BLOCKED_TAGS

    ]


def _normalize_text(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.lower()).strip()


def _is_usable_track_title(title: str | None) -> bool:
    if not title:
        return False
    normalized = _normalize_text(title)
    if not normalized:
        return False
    if normalized in BLOCKED_TRACK_TITLES:
        return False
    if normalized.startswith("unknown ") or normalized.startswith("untitled "):
        return False
    return True


def _artist_name_score(expected_name: str, actual_name: str) -> int:
    expected = _normalize_text(expected_name)
    actual = _normalize_text(actual_name)

    if not expected or not actual:
        return 0
    if expected == actual:
        return 3
    if expected in actual or actual in expected:
        return 2
    expected_words = set(expected.split())
    actual_words = set(actual.split())
    if expected_words and expected_words & actual_words:
        return 1
    return 0


def _collect_track_candidates(
    recordings: list,
    preferred_artist_mbids: set[str],
    preferred_artist_names: dict[str, str],
    base_score: int,
    seen_titles: set[str],
) -> list[tuple[int, dict]]:
    scored_tracks = []

    for recording in recordings:
        raw_title = recording.get("title")
        if not _is_usable_track_title(raw_title):
            continue

        artist_credit = recording.get("artist-credit") or []
        if not artist_credit:
            continue

        artist_name = artist_credit[0].get("name", "")
        artist_obj = artist_credit[0].get("artist") or {}
        artist_mb_id = artist_obj.get("id", "")

        title_key = f"{_normalize_text(raw_title)}::{artist_mb_id}"
        if title_key in seen_titles:
            continue

        seen_titles.add(title_key)
        score = base_score

        if artist_mb_id in preferred_artist_mbids:
            score += 5

        expected_artist_name = preferred_artist_names.get(artist_mb_id)
        if expected_artist_name:
            score += _artist_name_score(expected_artist_name, artist_name)

        if artist_name:
            score += 1

        if recording.get("first-release-date"):
            score += 1

        scored_tracks.append(
            (
                score,
                {
                    "mb_id": recording.get("id"),
                    "artist_mb_id": artist_mb_id,
                    "artist_name": artist_name,
                    "title": raw_title,
                    "release_title": None,
                    "length_ms": recording.get("length"),
                },
            )
        )

    return scored_tracks


def _request_mb(path: str, params: dict) -> dict:
    headers = {
        "User-Agent": "VibeMatch/1.0 (vibematch@gmailcom)"
    }
    res = request.get(
        f"{base_url}{path}",
        params=params,
        headers=headers,
        timeout=15,
    )
    res.raise_for_status()
    time.sleep(1)
    return res.json()

def search_artist(name):
    params = {
        "query": name,
        "fmt" : "json",
        "limit" : 5
    }
    try:
        data = _request_mb("artist/", params)

        artists = []

        for a in data.get("artists", []):
            artists.append({
                "mb_id" : a .get("id"),
                "name" : a.get("name"),
                "country" : a.get("country"),
                "type" : a.get("type"),
                "disambiguation" : a.get("disambiguation",""),
                "tags" : clean_tags(a.get("tags", [])),
                "score" : a.get("score")
            })

        return {"artists": artists}
    except request.exceptions.Timeout:
        return {"error" : "'musicbrainz API request timed out"}
    except request.exceptions.RequestException as e:
        return {"error" : f"Request failed: {str(e)}"}


def search_artist_recordings(artist_mb_id: str, limit: int = 10):
    params = {
        "artist": artist_mb_id,
        "fmt": "json",
        "limit": max(limit * 5, 25),
        "inc": "artist-credits",
    }

    try:
        artist_data = _request_mb(
            f"artist/{artist_mb_id}",
            {
                "fmt": "json",
            },
        )
        expected_artist_name = artist_data.get("name", "")
        data = _request_mb("recording", params)
        scored_tracks = []
        seen_titles = set()

        for recording in data.get("recordings", []):
            artist_credit = recording.get("artist-credit") or []
            artist_name = artist_credit[0].get("name") if artist_credit else ""
            title = recording.get("title")

            if not _is_usable_track_title(title):
                continue

            title_key = _normalize_text(title)
            if title_key in seen_titles:
                continue

            score = _artist_name_score(expected_artist_name, artist_name)
            if score == 0:
                continue

            seen_titles.add(title_key)
            scored_tracks.append((
                score,
                {
                    "mb_id": recording.get("id"),
                    "artist_mb_id": artist_mb_id,
                    "artist_name": artist_name,
                    "title": title,
                    "release_title": None,
                    "length_ms": recording.get("length"),
                }
            ))

        scored_tracks.sort(key=lambda item: (-item[0], item[1]["title"].lower()))
        tracks = [track for _, track in scored_tracks[:limit]]

        return {"tracks": tracks}
    except request.exceptions.Timeout:
        return {"error": "musicbrainz API request timed out"}
    except request.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}

def search_tracks_by_title(
    title: str,
    artist_name: str | None = None,
    preferred_artists: dict[str, str] | None = None,
    preferred_artist_mbids: set[str] | None = None,
    limit: int = 10,
):
    preferred_artists = preferred_artists or {}
    preferred_artist_mbids = preferred_artist_mbids or set()
    preferred_artist_mbids = preferred_artist_mbids | set(preferred_artists.keys())

    try:
        scored_tracks = []
        seen_titles = set()

        if artist_name:
            direct_params = {
                "query": f'recording:"{title}" AND artist:"{artist_name}"',
                "fmt": "json",
                "limit": max(limit * 3, 15),
            }
            direct_data = _request_mb("recording/", direct_params)
            scored_tracks.extend(
                _collect_track_candidates(
                    direct_data.get("recordings", []),
                    preferred_artist_mbids=preferred_artist_mbids,
                    preferred_artist_names=preferred_artists,
                    base_score=12,
                    seen_titles=seen_titles,
                )
            )

        for artist_mb_id, artist_name in preferred_artists.items():
            params = {
                "query": f'recording:"{title}" AND artist:"{artist_name}"',
                "fmt": "json",
                "limit": max(limit * 2, 10),
            }
            data = _request_mb("recording/", params)
            preferred_artist_name_map = {artist_mb_id: artist_name}
            scored_tracks.extend(
                _collect_track_candidates(
                    data.get("recordings", []),
                    preferred_artist_mbids=preferred_artist_mbids,
                    preferred_artist_names=preferred_artist_name_map,
                    base_score=10,
                    seen_titles=seen_titles,
                )
            )

        global_params = {
            "query": f'recording:{title}',
            "fmt": "json",
            "limit": max(limit * 5, 25),
        }
        global_data = _request_mb("recording/", global_params)
        scored_tracks.extend(
            _collect_track_candidates(
                global_data.get("recordings", []),
                preferred_artist_mbids=preferred_artist_mbids,
                preferred_artist_names=preferred_artists,
                base_score=0,
                seen_titles=seen_titles,
            )
        )

        scored_tracks.sort(key=lambda item: (-item[0], item[1]["title"].lower()))
        tracks = [track for _, track in scored_tracks[:limit]]

        return {"tracks": tracks}

    except request.exceptions.Timeout:
        return {"error": "musicbrainz API request timed out"}

    except request.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}
