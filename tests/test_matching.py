import pytest

def test_music_profile_and_matching(client):
    # Register User A (Alice)
    alice = client.post("/auth/register", json={
        "name": "Alice",
        "email": "alice@music.com",
        "password": "password123"
    }).json()
    alice_token = alice["access_token"]
    alice_id = alice["user"]["id"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # Register User B (Bob)
    bob = client.post("/auth/register", json={
        "name": "Bob",
        "email": "bob@music.com",
        "password": "password123"
    }).json()
    bob_token = bob["access_token"]
    bob_id = bob["user"]["id"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # Verify initial music profile status for Alice
    response = client.get(f"/user/{alice_id}/music-profile-status", headers=alice_headers)
    assert response.status_code == 200
    status = response.json()
    assert status["music_profile_complete"] is False
    assert status["artists_complete"] is False
    assert status["tracks_complete"] is False

    # Check matching is blocked for incomplete profile
    response = client.get(f"/match/{alice_id}", headers=alice_headers)
    assert response.status_code == 400
    assert "music" in response.json()["detail"].lower()

    # Alice adds 3 artists
    artists_to_add = [
        {"mb_id": "art-1", "name": "Kanye West", "tags": ["hip-hop", "rap"]},
        {"mb_id": "art-2", "name": "Drake", "tags": ["hip-hop", "pop"]},
        {"mb_id": "art-3", "name": "Travis Scott", "tags": ["hip-hop", "trap"]}
    ]
    for artist in artists_to_add:
        res = client.post(f"/user/{alice_id}/add_artist", json=artist, headers=alice_headers)
        assert res.status_code == 201

    # Alice adds 4 tracks
    tracks_to_add = [
        {"mb_id": "tr-1", "artist_mb_id": "art-2", "artist_name": "Drake", "title": "God's Plan"},
        {"mb_id": "tr-2", "artist_mb_id": "art-2", "artist_name": "Drake", "title": "Hotline Bling"},
        {"mb_id": "tr-3", "artist_mb_id": "art-1", "artist_name": "Kanye West", "title": "Stronger"},
        {"mb_id": "tr-4", "artist_mb_id": "art-3", "artist_name": "Travis Scott", "title": "Sicko Mode"}
    ]
    for track in tracks_to_add:
        res = client.post(f"/user/{alice_id}/add_track", json=track, headers=alice_headers)
        assert res.status_code == 201

    # Verify Alice's status is now complete
    status = client.get(f"/user/{alice_id}/music-profile-status", headers=alice_headers).json()
    assert status["music_profile_complete"] is True

    # Setup Bob's music profile (so he is a valid match candidate)
    # Bob adds 3 artists
    for artist in artists_to_add:
        client.post(f"/user/{bob_id}/add_artist", json=artist, headers=bob_headers)
    # Bob adds 4 tracks
    for track in tracks_to_add:
        client.post(f"/user/{bob_id}/add_track", json=track, headers=bob_headers)

    # Bob's profile should now be complete too
    status = client.get(f"/user/{bob_id}/music-profile-status", headers=bob_headers).json()
    assert status["music_profile_complete"] is True

    # Now run matching for Alice
    match_response = client.get(f"/match/{alice_id}", headers=alice_headers)
    assert match_response.status_code == 200
    data = match_response.json()
    assert data["match_count"] > 0
    match = data["matches"][0]
    assert match["user_id"] == bob_id
    assert match["similarity"] > 0.0  # mock embeddings are similar
    assert "God's Plan" in match["shared_tracks"]
    assert "Kanye West" in match["shared_artists"]

    # Test removing an artist from Alice
    remove_art = client.delete(f"/user/{alice_id}/artists/art-3", headers=alice_headers)
    assert remove_art.status_code == 200
    # Check updated artists list
    artists_list = client.get(f"/user/{alice_id}/artists", headers=alice_headers).json()
    assert len(artists_list["artists"]) == 2

    # Check updated match status (profile should now be incomplete again)
    status = client.get(f"/user/{alice_id}/music-profile-status", headers=alice_headers).json()
    assert status["music_profile_complete"] is False
