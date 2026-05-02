import requests as request
import time
base_url = "https://musicbrainz.org/ws/2/"

BLOCKED_TAGS = {
    "cotm candidate", "lesbian", "gay", "pedophilia",
    "relic inn", "rap us", "hardcore hip", "death by suicide",
    "death by overdose", "death by amitriptyline"
}

def clean_tags(tags: list) -> list:
    return[
        t["name"] for t in tags
        if t["count"] > 5
        and t["name"] not in BLOCKED_TAGS

    ]


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
        "limit": limit,
        "inc": "releases",
    }

    try:
        data = _request_mb("recording", params)
        tracks = []

        for recording in data.get("recordings", []):
            release_title = None
            releases = recording.get("releases") or []
            if releases:
                release_title = releases[0].get("title")

            artist_credit = recording.get("artist-credit") or []
            artist_name = artist_credit[0].get("name") if artist_credit else ""

            tracks.append({
                "mb_id": recording.get("id"),
                "artist_mb_id": artist_mb_id,
                "artist_name": artist_name,
                "title": recording.get("title"),
                "release_title": release_title,
                "length_ms": recording.get("length"),
            })

        return {"tracks": tracks}
    except request.exceptions.Timeout:
        return {"error": "musicbrainz API request timed out"}
    except request.exceptions.RequestException as e:
        return {"error": f"Request failed: {str(e)}"}
