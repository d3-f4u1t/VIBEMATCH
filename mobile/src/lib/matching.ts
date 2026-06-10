const API_BASE_URL = "http://192.168.1.37:8000";

export type MatchResult = {
  userId: string;
  name: string;
  similarity: number;
  artistCount: number;
  trackCount: number;
  sharedArtists: string[];
  sharedTracks: string[];
  matchReason: string;
};

type MatchApiResponse = {
  matches?: Array<{
    user_id: string;
    name: string;
    similarity: number;
    artist_count: number;
    track_count: number;
    shared_artists: string[];
    shared_tracks: string[];
    match_reason: string;
  }>;
  detail?: string;
};

export async function getMatches(userId: string): Promise<MatchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/match/${encodeURIComponent(userId)}?limit=8`,
    {
      method: "GET",
    }
  );

  const data = (await response.json()) as MatchApiResponse;

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to load matches right now."
    );
  }

  return (data.matches ?? []).map((match) => ({
    userId: match.user_id,
    name: match.name,
    similarity: match.similarity,
    artistCount: match.artist_count,
    trackCount: match.track_count,
    sharedArtists: match.shared_artists,
    sharedTracks: match.shared_tracks,
    matchReason: match.match_reason,
  }));
}
