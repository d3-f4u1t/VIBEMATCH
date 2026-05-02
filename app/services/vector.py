# for music vector


def build_music_text(user):
    """
    Convert a user's saved artists and tracks into one text string.
    This text can later be turned into an embedding vector.
    """
    artists = user.artists or []
    tracks = user.tracks or []

    if not artists and not tracks:
        return ""

    artist_names = [artist.name for artist in artists if artist.name]

    all_tags = []
    for artist in artists:
        if artist.tags and isinstance(artist.tags, list):
            all_tags.extend(artist.tags)

    unique_tags = list(dict.fromkeys(all_tags))[:25]

    track_titles = [track.title for track in tracks if track.title]
    track_artists = list(
        dict.fromkeys(track.artist_name for track in tracks if track.artist_name)
    )

    parts = []

    if artist_names:
        parts.append(f"Favorite artists: {', '.join(artist_names)}")

    if track_titles:
        parts.append(f"Favorite songs: {', '.join(track_titles)}")

    if track_artists:
        parts.append(f"Songs selected from artists: {', '.join(track_artists)}")

    if unique_tags:
        parts.append(f"Genres and styles: {', '.join(unique_tags)}")

    return ". ".join(parts) + "."
