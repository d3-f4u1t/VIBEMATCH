import pytest

def test_swipe_match_and_chat_flow(client):
    # 1. Register User A (Alice)
    alice = client.post("/auth/register", json={
        "name": "Alice",
        "email": "alice@chat.com",
        "password": "password123"
    }).json()
    alice_token = alice["access_token"]
    alice_id = alice["user"]["id"]
    alice_headers = {"Authorization": f"Bearer {alice_token}"}

    # 2. Register User B (Bob)
    bob = client.post("/auth/register", json={
        "name": "Bob",
        "email": "bob@chat.com",
        "password": "password123"
    }).json()
    bob_token = bob["access_token"]
    bob_id = bob["user"]["id"]
    bob_headers = {"Authorization": f"Bearer {bob_token}"}

    # Complete Alice's profile (3 artists, 4 tracks)
    artists_to_add = [
        {"mb_id": "art-1", "name": "Kanye West", "tags": ["hip-hop"]},
        {"mb_id": "art-2", "name": "Drake", "tags": ["pop"]},
        {"mb_id": "art-3", "name": "Travis Scott", "tags": ["trap"]}
    ]
    for artist in artists_to_add:
        client.post(f"/user/{alice_id}/add_artist", json=artist, headers=alice_headers)
    
    tracks_to_add = [
        {"mb_id": "tr-1", "artist_mb_id": "art-2", "artist_name": "Drake", "title": "God's Plan"},
        {"mb_id": "tr-2", "artist_mb_id": "art-2", "artist_name": "Drake", "title": "Hotline Bling"},
        {"mb_id": "tr-3", "artist_mb_id": "art-1", "artist_name": "Kanye West", "title": "Stronger"},
        {"mb_id": "tr-4", "artist_mb_id": "art-3", "artist_name": "Travis Scott", "title": "Sicko Mode"}
    ]
    for track in tracks_to_add:
        client.post(f"/user/{alice_id}/add_track", json=track, headers=alice_headers)

    # Complete Bob's profile
    for artist in artists_to_add:
        client.post(f"/user/{bob_id}/add_artist", json=artist, headers=bob_headers)
    for track in tracks_to_add:
        client.post(f"/user/{bob_id}/add_track", json=track, headers=bob_headers)

    # 3. Alice likes Bob
    swipe_payload = {
        "swiped_user_id": bob_id,
        "action": "like"
    }
    swipe_res = client.post("/swipe/", json=swipe_payload, headers=alice_headers)
    assert swipe_res.status_code == 201
    assert swipe_res.json()["action"] == "like"

    # 4. Verify no mutual matches yet for Alice
    mutual_res = client.get(f"/swipe/mutual/{alice_id}", headers=alice_headers)
    assert mutual_res.status_code == 200
    assert mutual_res.json()["mutual_match_count"] == 0

    # 5. Try opening chat before mutual match (should be 403 Forbidden)
    open_chat_forbidden = client.post(f"/chat/conversations/{bob_id}", headers=alice_headers)
    assert open_chat_forbidden.status_code == 403
    assert "mutual match" in open_chat_forbidden.json()["detail"]

    # 6. Bob likes Alice
    swipe_payload_bob = {
        "swiped_user_id": alice_id,
        "action": "like"
    }
    swipe_res_bob = client.post("/swipe/", json=swipe_payload_bob, headers=bob_headers)
    assert swipe_res_bob.status_code == 201

    # 7. Check mutual matches now
    mutual_res = client.get(f"/swipe/mutual/{alice_id}", headers=alice_headers)
    assert mutual_res.status_code == 200
    assert mutual_res.json()["mutual_match_count"] == 1
    assert mutual_res.json()["matches"][0]["user_id"] == bob_id

    # 8. Alice opens conversation with Bob
    open_conv = client.post(f"/chat/conversations/{bob_id}", headers=alice_headers)
    assert open_conv.status_code == 201
    conv_data = open_conv.json()
    assert conv_data["other_user_id"] == bob_id
    conversation_id = conv_data["id"]

    # 9. Alice retrieves conversations list
    conv_list = client.get("/chat/conversations", headers=alice_headers).json()
    assert conv_list["conversation_count"] == 1
    assert conv_list["conversations"][0]["id"] == conversation_id

    # 10. Alice sends a message to Bob
    message_payload = {"content": "Hey Bob! Loved your taste in Drake."}
    msg_res = client.post(f"/chat/conversations/{conversation_id}/messages", json=message_payload, headers=alice_headers)
    assert msg_res.status_code == 201
    assert msg_res.json()["content"] == "Hey Bob! Loved your taste in Drake."
    assert msg_res.json()["sender_id"] == alice_id

    # 11. Bob retrieves messages in this conversation
    messages_res = client.get(f"/chat/conversations/{conversation_id}/messages", headers=bob_headers)
    assert messages_res.status_code == 200
    messages_data = messages_res.json()
    assert messages_data["message_count"] == 1
    assert messages_data["messages"][0]["content"] == "Hey Bob! Loved your taste in Drake."
    assert messages_data["messages"][0]["sender_id"] == alice_id
