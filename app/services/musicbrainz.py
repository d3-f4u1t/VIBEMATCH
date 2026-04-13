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

def search_artist(name):
    url = f"{base_url}artist/"

    params = {
        "query": name,
        "fmt" : "json",
        "limit" : 5
    }

    headers = {
        "User-Agent": "VibeMatch/1.0 (vibematch@gmailcom)"   
    }
    try:
        res = request.get(url, params = params, headers = headers)
        res.raise_for_status()
        data = res.json()

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

        time.sleep(1)
        return {"artists": artists}
    except request.exceptions.Timeout:
        return {"error" : "'musicbrainz API request timed out"}
    except request.exceptions.RequestException as e:
        return {"error" : f"Request failed: {str()}"}
