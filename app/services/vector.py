#for music vector

def build_music_text(artists):
    '''
    converts a user saved artist into a one text string
    this text then will later be turend into a embedding vecotr

    '''
    if not artists:
        return ""
    
    artist_names = [artists.name for artist in artists if artist.name]

    all_tags = []
    for artist in artists:
        if artist.tags and isinstance(artist.tags,list):
            all_tags.extend(artist.tag)

    unique_tags = list(dict.fromkeys(all_tags))[:25]

    text = f"Artists:{','.join(artist_names)}."

    if unique_tags:
        text += f"Genres and styles: {','.join(unique_tags)}."

    return text


