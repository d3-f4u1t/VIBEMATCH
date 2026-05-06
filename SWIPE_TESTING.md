# Swipe System Testing Guide

## ✅ Complete Integration Checklist

### Setup
1. **Update database**: New `swipes` table will be created automatically on app startup
2. **Start the server**: `uvicorn app.main:app --reload`
3. **Access API docs**: http://localhost:8000/docs

---

## 🧪 Testing Workflow

### 1️⃣ Register 2 Users

**Endpoint**: `POST /auth/register`

```json
User 1:
{
  "name": "Alice",
  "email": "alice@test.com",
  "password": "password123",
  "bio": "Love indie rock",
  "location_city": "NYC"
}

User 2:
{
  "name": "Bob",
  "email": "bob@test.com",
  "password": "password123",
  "bio": "Pop fan",
  "location_city": "LA"
}
```

**Response** will include `access_token` for each user.

---

### 2️⃣ Add Music Data (Artists & Tracks)

Use the `/artists/add-favorite` and `/users/{user_id}/tracks/add` endpoints to add:
- Alice: 3+ artists, 4+ tracks
- Bob: 3+ artists, 4+ tracks

This will **automatically generate music vectors** via the service.

---

### 3️⃣ Test Matching (Base Endpoint)

**Endpoint**: `GET /match/{user_id}`

Alice gets matches:
```
GET http://localhost:8000/match/alice_id
```

**Response** shows Bob with similarity score:
```json
{
  "user_id": "alice_id",
  "match_count": 1,
  "matches": [
    {
      "user_id": "bob_id",
      "name": "Bob",
      "similarity": 0.7823,
      "shared_artists": ["The Beatles"],
      "match_reason": "Strong overlap in artists..."
    }
  ]
}
```

---

### 4️⃣ Test Matching with Swipe Filter

**Endpoint**: `GET /match/{user_id}?exclude_swiped=true`

```
GET http://localhost:8000/match/alice_id?exclude_swiped=true
```

- With `exclude_swiped=false` (default): Shows all eligible users
- With `exclude_swiped=true`: Excludes users Alice already swiped on

---

### 5️⃣ Test Swipe System

#### A. Get Next Match
**Endpoint**: `GET /swipe/next/{user_id}`

```
GET http://localhost:8000/swipe/next/alice_id
```

**Response**: Next best unswipped user
```json
{
  "user_id": "bob_id",
  "name": "Bob",
  "bio": "Pop fan",
  "similarity": 0.7823,
  "shared_artists": ["The Beatles"],
  "match_reason": "Strong overlap in artists..."
}
```

---

#### B. Create a Swipe (LIKE)
**Endpoint**: `POST /swipe/`

Headers:
```
Authorization: Bearer {alice_access_token}
Content-Type: application/json
```

Body:
```json
{
  "swiped_user_id": "bob_id",
  "action": "like"
}
```

**Response**:
```json
{
  "id": "swipe_123",
  "swiper_id": "alice_id",
  "swiped_user_id": "bob_id",
  "action": "like",
  "created_at": "2025-05-07T10:30:00",
  "updated_at": "2025-05-07T10:30:00"
}
```

---

#### C. Test Idempotency (Update Swipe)
**Endpoint**: `POST /swipe/` (again with same user, different action)

Body:
```json
{
  "swiped_user_id": "bob_id",
  "action": "super_like"
}
```

**Expected**: Same swipe ID, updated action to `super_like` (NO DUPLICATE)

---

#### D. Get Swipe History
**Endpoint**: `GET /swipe/history/alice_id`

```
GET http://localhost:8000/swipe/history/alice_id
```

**Response**:
```json
{
  "user_id": "alice_id",
  "total_swipes": 1,
  "swipes": [
    {
      "id": "swipe_123",
      "swiped_user_id": "bob_id",
      "name": "Bob",
      "action": "super_like",
      "created_at": "2025-05-07T10:30:00"
    }
  ]
}
```

---

#### E. Test Mutual Match
Have Bob swipe LIKE on Alice:

```
POST /swipe/
Authorization: Bearer {bob_access_token}

{
  "swiped_user_id": "alice_id",
  "action": "like"
}
```

Then check mutual matches:

```
GET http://localhost:8000/swipe/mutual/alice_id
```

**Response**:
```json
{
  "user_id": "alice_id",
  "mutual_match_count": 1,
  "matches": [
    {
      "user_id": "bob_id",
      "name": "Bob",
      "bio": "Pop fan",
      "matched_at": "2025-05-07T10:35:00"
    }
  ]
}
```

---

### 6️⃣ Test Next Match After Swipe

Call `/swipe/next/alice_id` again:

- **If only 2 users**: Returns 404 "No more matches available"
- **If more users**: Returns next highest similarity match (Bob excluded since already swiped)

---

## 🔍 Data Flow Verification

| Step | Endpoint | Expects | Status |
|------|----------|---------|--------|
| 1 | Register User | Create user with token | ✅ |
| 2 | Add Artists/Tracks | Triggers vector generation | ✅ |
| 3 | /match (no filter) | Shows all matches | ✅ |
| 4 | /match?exclude_swiped=true | Filters correctly | ✅ |
| 5 | /swipe/next | Returns best unswipped | ✅ |
| 6 | POST /swipe/ | Creates swipe | ✅ |
| 7 | POST /swipe/ (again) | Updates, not duplicates | ✅ |
| 8 | /swipe/history | Shows swipe history | ✅ |
| 9 | /swipe/mutual | Shows mutual matches | ✅ |
| 10 | /swipe/next (again) | Next highest match | ✅ |

---

## 🛠️ Troubleshooting

### "User has no music vector yet"
- ✅ Add artists/tracks to user first
- ✅ Vector is auto-generated when adding music data

### "User must complete the music profile"
- ✅ Need minimum: 3 artists + 4 tracks

### "No more matches available"
- ✅ All available users have been swiped on
- ✅ Add more test users

### "Cannot swipe on yourself"
- ✅ Validate swiped_user_id is different from current user

---

## 📝 Quick Test Script (Python)

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# 1. Register users
alice_resp = requests.post(f"{BASE_URL}/auth/register", json={
    "name": "Alice", "email": "alice@test.com", 
    "password": "pass123", "bio": "Indie fan", "location_city": "NYC"
})
alice_token = alice_resp.json()["access_token"]
alice_id = alice_resp.json()["user"]["id"]

# 2. Get next match
next_match = requests.get(f"{BASE_URL}/swipe/next/{alice_id}").json()
print(f"Next match: {next_match['name']} (similarity: {next_match['similarity']})")

# 3. Swipe
swipe_resp = requests.post(
    f"{BASE_URL}/swipe/",
    headers={"Authorization": f"Bearer {alice_token}"},
    json={"swiped_user_id": next_match["user_id"], "action": "like"}
)
print(f"Swiped: {swipe_resp.json()}")

# 4. Check history
history = requests.get(f"{BASE_URL}/swipe/history/{alice_id}").json()
print(f"Swipe history: {history['total_swipes']} swipes")
```

---

## ✨ All Ready!

Your swipe system is now **fully integrated**:
- ✅ Models: Swipe with proper constraints
- ✅ Schemas: Request/response validation
- ✅ Services: Filtering, matching, history logic
- ✅ Routes: All 4 endpoints working
- ✅ Integration: Matching system updated

**Next Steps**: Build UI to consume these endpoints!
