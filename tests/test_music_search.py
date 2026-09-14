"""Tests for the hybrid Deezer + iTunes music search service.

All external HTTP is monkeypatched — no network access.
"""
import pytest

from app.services import musicbrainz as mb


@pytest.fixture(autouse=True)
def no_lastfm(monkeypatch):
    monkeypatch.setattr(mb, "LASTFM_API_KEY", "")


def _dz_artist(did="5531258", name="SZA", fans=123):
    return {
        "id": 5531258 if did == "5531258" else did,
        "name": name,
        "type": "Artist",
        "nb_fan": fans,
        "picture_medium": "https://cdn-images.dzcdn.net/pic.jpg",
    }


def _dz_track(tid=111, title="Kill Bill", artist="SZA", aid="5531258"):
    return {
        "id": tid,
        "type": "track",
        "title": title,
        "artist": {"id": int(aid) if str(aid).isdigit() else aid, "name": artist},
        "album": {"title": "SOS", "cover_medium": "https://cover.jpg"},
        "duration": 153,
        "preview": "https://preview.mp3",
        "rank": 900000,
    }


def _it_track(tid=1441399298, title="Kill Bill", artist="SZA", aid=605800394):
    return {
        "wrapperType": "track",
        "trackId": tid,
        "trackName": title,
        "artistId": aid,
        "artistName": artist,
        "collectionName": "SOS",
        "trackTimeMillis": 153000,
        "previewUrl": "https://audio-preview.m4a",
        "artworkUrl100": "https://is1-ssl.mzstatic.com/img/100x100bb.jpg",
    }


def test_search_artist_uses_deezer(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [_dz_artist()], "total": 1})
    out = mb.search_artist("SZA")
    assert "error" not in out
    assert out["artists"][0]["mb_id"] == "5531258"
    assert out["artists"][0]["name"] == "SZA"


def test_search_artist_falls_back_to_itunes(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [], "total": 0})
    monkeypatch.setattr(mb, "_itunes_search", lambda params: [{
        "artistId": 605800394, "artistName": "SZA",
        "artistType": "Artist", "primaryGenreName": "R&B/Soul",
    }])
    out = mb.search_artist("SZA")
    assert out["artists"][0]["mb_id"] == "itunes:605800394"
    assert out["artists"][0]["tags"] == ["R&B/Soul"]


def test_search_tracks_uses_deezer(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [_dz_track()], "total": 1})
    out = mb.search_tracks_by_title("Kill Bill")
    assert "error" not in out
    assert out["tracks"][0]["mb_id"] == "111"
    assert out["tracks"][0]["preview_url"] == "https://preview.mp3"


def test_search_tracks_falls_back_to_itunes(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [], "total": 0})
    monkeypatch.setattr(mb, "_itunes_search", lambda params: [_it_track()])
    out = mb.search_tracks_by_title("Kill Bill", artist_name="SZA")
    assert "error" not in out
    track = out["tracks"][0]
    assert track["mb_id"] == "itunes:1441399298"
    assert track["artist_name"] == "SZA"
    assert track["length_ms"] == 153000
    assert track["cover_medium"].endswith("600x600bb.jpg")


def test_search_tracks_prefers_user_artists_by_name(monkeypatch):
    """iTunes results get boosted when the artist name matches a picked artist."""
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [], "total": 0})
    monkeypatch.setattr(mb, "_itunes_search", lambda params: [
        _it_track(tid=1, artist="Random Singer", aid=1),
        _it_track(tid=2, artist="SZA", aid=605800394),
    ])
    out = mb.search_tracks_by_title(
        "Kill Bill",
        preferred_artists={"5531258": "SZA"},
        preferred_artist_mbids={"5531258"},
    )
    assert out["tracks"][0]["artist_name"] == "SZA"


def test_search_tracks_errors_when_everything_empty(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {})
    monkeypatch.setattr(mb, "_itunes_search", lambda params: [])
    assert "error" in mb.search_tracks_by_title("xyzabc")


def test_recordings_uses_deezer(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [_dz_track()], "total": 1})
    out = mb.search_artist_recordings("5531258")
    assert out["tracks"][0]["title"] == "Kill Bill"


def test_recordings_falls_back_to_itunes(monkeypatch):
    def fake_deezer(path, params=None):
        if path.startswith("/artist/5531258/top"):
            return {"data": [], "total": 0}
        return {}
    monkeypatch.setattr(mb, "_deezer_get", fake_deezer)
    monkeypatch.setattr(mb, "_itunes_search", lambda params: [_it_track(), _it_track(tid=3, title="Snooze")])
    out = mb.search_artist_recordings("5531258", limit=2, artist_name="SZA")
    assert len(out["tracks"]) == 2
    assert all(t["mb_id"].startswith("itunes:") for t in out["tracks"])


def test_recordings_itunes_artist_id(monkeypatch):
    monkeypatch.setattr(mb, "_itunes_lookup", lambda *a, **k: [_it_track()])
    out = mb.search_artist_recordings("itunes:605800394")
    assert out["tracks"][0]["mb_id"] == "itunes:1441399298"


class _FakeResp:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        pass

    def json(self):
        return self._payload


def test_deezer_response_cached(monkeypatch):
    calls = []

    def fake_get(url, params=None, timeout=None):
        calls.append((url, tuple(sorted((params or {}).items()))))
        return _FakeResp({"data": [{
            "id": 999, "name": "Cache Test Artist", "type": "Artist",
            "nb_fan": 1, "picture_medium": None}], "total": 1})

    monkeypatch.setattr(mb._session, "get", fake_get)
    first = mb.search_artist("Cache Test Artist")
    second = mb.search_artist("Cache Test Artist")
    assert first == second
    assert len(calls) == 1  # second call served from in-memory cache


def test_itunes_response_cached(monkeypatch):
    monkeypatch.setattr(mb, "_deezer_get", lambda *a, **k: {"data": [], "total": 0})
    calls = []

    def fake_get(url, params=None, timeout=None):
        calls.append(url)
        return _FakeResp({"resultCount": 1, "results": [{
            "wrapperType": "track", "trackId": 424242, "trackName": "Cache Test Song",
            "artistId": 434343, "artistName": "Cache Test Singer",
            "collectionName": "Cache Album", "trackTimeMillis": 120000,
            "previewUrl": "https://preview", "artworkUrl100": "https://art/100x100bb.jpg",
        }]})

    monkeypatch.setattr(mb._session, "get", fake_get)
    first = mb.search_tracks_by_title("Cache Test Song")
    second = mb.search_tracks_by_title("Cache Test Song")
    assert first == second
    assert first["tracks"][0]["mb_id"] == "itunes:424242"
    assert len(calls) == 1  # second call served from in-memory cache
