import json
from pathlib import Path

from app.auth import hash_password
from app.database import SessionLoacl
from app.models.artist import Artist
from app.models.track import Track
from app.models.user import User
from app.services.vector import build_and_save_vector


SEED_FILE = Path("proxy_seed_data.json")


def get_or_create_user(db, user_data: dict) -> User:
    user = db.query(User).filter(User.email == user_data["email"]).first()
    if user:
        for field_name in (
            "name",
            "bio",
            "location_city",
            "date_of_birth",
            "pronouns",
            "gender",
            "sexuality",
            "height",
            "weight",
            "ethnicity",
            "z_sign",
            "f_plan",
            "pets",
            "religion",
            "habit",
        ):
            if field_name in user_data:
                setattr(user, field_name, user_data[field_name])
        db.commit()
        db.refresh(user)
        return user

    user = User(
        name=user_data["name"],
        email=user_data["email"].strip().lower(),
        password_hash=hash_password(user_data["password"]),
        bio=user_data.get("bio") or "",
        location_city=user_data.get("location_city") or "",
        date_of_birth=user_data.get("date_of_birth"),
        pronouns=user_data.get("pronouns"),
        gender=user_data.get("gender"),
        sexuality=user_data.get("sexuality"),
        height=user_data.get("height"),
        weight=user_data.get("weight"),
        ethnicity=user_data.get("ethnicity"),
        z_sign=user_data.get("z_sign"),
        f_plan=user_data.get("f_plan"),
        pets=user_data.get("pets"),
        religion=user_data.get("religion"),
        habit=user_data.get("habit"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def get_or_create_artist(db, artist_data: dict) -> Artist:
    artist = db.query(Artist).filter(Artist.mb_id == artist_data["mb_id"]).first()
    if artist:
        return artist

    artist = Artist(
        mb_id=artist_data["mb_id"],
        name=artist_data["name"],
        country=artist_data.get("country"),
        tags=artist_data.get("tags") or [],
        artist_type=artist_data.get("artist_type"),
    )
    db.add(artist)
    db.commit()
    db.refresh(artist)
    return artist


def get_or_create_track(db, track_data: dict) -> Track:
    track = db.query(Track).filter(Track.mb_id == track_data["mb_id"]).first()
    if track:
        return track

    track = Track(
        mb_id=track_data["mb_id"],
        artist_mb_id=track_data["artist_mb_id"],
        artist_name=track_data["artist_name"],
        title=track_data["title"],
        release_title=track_data.get("release_title"),
        length_ms=track_data.get("length_ms"),
    )
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


def seed_user_music(db, user: User, user_data: dict) -> None:
    for artist_data in user_data.get("artists", []):
        artist = get_or_create_artist(db, artist_data)
        if artist not in user.artists:
            user.artists.append(artist)

    for track_data in user_data.get("tracks", []):
        track = get_or_create_track(db, track_data)
        if track not in user.tracks:
            user.tracks.append(track)

    db.commit()
    db.refresh(user)
    build_and_save_vector(user, db)


def main():
    if not SEED_FILE.exists():
        raise FileNotFoundError(f"Seed file not found: {SEED_FILE}")

    payload = json.loads(SEED_FILE.read_text(encoding="utf-8"))
    users = payload.get("users", [])

    db = SessionLoacl()
    try:
        for user_data in users:
            user = get_or_create_user(db, user_data)
            seed_user_music(db, user, user_data)
            print(
                f"Seeded {user.name} "
                f"(artists={len(user.artists)}, tracks={len(user.tracks)})"
            )
    finally:
        db.close()


if __name__ == "__main__":
    main()
