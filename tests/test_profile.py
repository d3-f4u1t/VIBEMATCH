import pytest
from datetime import date

def test_register_and_login(client):
    # Test registration
    reg_payload = {
        "name": "Alice",
        "email": "alice@example.com",
        "password": "password123",
        "bio": "Alice's bio",
        "location_city": "New York"
    }
    response = client.post("/auth/register", json=reg_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"
    token = data["access_token"]
    user_id = data["user"]["id"]

    # Test login
    login_payload = {
        "email": "alice@example.com",
        "password": "password123"
    }
    response = client.post("/auth/login", json=login_payload)
    assert response.status_code == 200
    login_data = response.json()
    assert login_data["access_token"] == token

    # Test get me
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["id"] == user_id


def test_profile_update_and_retrieve(client):
    # Register a user
    reg_payload = {
        "name": "Bob",
        "email": "bob@example.com",
        "password": "password123"
    }
    response = client.post("/auth/register", json=reg_payload)
    assert response.status_code == 201
    res_data = response.json()
    token = res_data["access_token"]
    user_id = res_data["user"]["id"]

    headers = {"Authorization": f"Bearer {token}"}

    # Update profile fields including the newly added 'weight' and 'habit' subfields
    profile_update = {
        "bio": "New bio for Bob",
        "location_city": "San Francisco",
        "date_of_birth": "1995-05-15",
        "pronouns": "he/him",
        "gender": "male",
        "sexuality": "straight",
        "height": "180cm",
        "weight": "75kg",
        "ethnicity": "mixed",
        "z_sign": "Taurus",
        "f_plan": "open to kids",
        "pets": "dog person",
        "religion": "spiritual",
        "habit": {
            "smoking": "never",
            "drinking": "socially",
            "weed": "no"
        }
    }

    # Patch profile
    patch_response = client.patch(f"/user/{user_id}/profile", json=profile_update, headers=headers)
    assert patch_response.status_code == 200
    patched_data = patch_response.json()
    assert patched_data["bio"] == "New bio for Bob"
    assert patched_data["weight"] == "75kg"
    assert patched_data["height"] == "180cm"
    assert patched_data["habit"]["drinking"] == "socially"

    # Get profile
    get_response = client.get(f"/user/{user_id}/profile", headers=headers)
    assert get_response.status_code == 200
    profile_data = get_response.json()
    assert profile_data["weight"] == "75kg"
    assert profile_data["height"] == "180cm"
    assert profile_data["z_sign"] == "Taurus"
    assert profile_data["habit"]["smoking"] == "never"


def test_profile_update_unauthorized(client):
    # Register User A
    user_a = client.post("/auth/register", json={
        "name": "User A",
        "email": "usera@example.com",
        "password": "password123"
    }).json()
    token_a = user_a["access_token"]

    # Register User B
    user_b = client.post("/auth/register", json={
        "name": "User B",
        "email": "userb@example.com",
        "password": "password123"
    }).json()
    user_b_id = user_b["user"]["id"]

    # Try to update User B's profile using User A's token
    headers = {"Authorization": f"Bearer {token_a}"}
    response = client.patch(f"/user/{user_b_id}/profile", json={"bio": "hack"}, headers=headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "not allowed"


def test_invalid_dob(client):
    # Register user
    user = client.post("/auth/register", json={
        "name": "Youngster",
        "email": "young@example.com",
        "password": "password123"
    }).json()
    token = user["access_token"]
    user_id = user["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    # Under 18 validation
    today = date.today()
    under_18_dob = f"{today.year - 10}-01-01"
    response = client.patch(f"/user/{user_id}/profile", json={"date_of_birth": under_18_dob}, headers=headers)
    assert response.status_code == 422
    assert "User must be at least 18 years old" in response.text
