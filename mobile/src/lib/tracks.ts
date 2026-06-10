const API_BASE_URL = "http://192.168.1.37:8000";

export type TrackSearchResult = {
  id: string;
  artistId: string;
  artistName: string;
  title: string;
  releaseTitle: string | null;
  lengthMs: number | null;
};

type TracksApiResponse = {
  tracks?: Array<{
    mb_id: string;
    artist_mb_id: string;
    artist_name: string;
    title: string;
    release_title?: string | null;
    length_ms?: number | null;
  }>;
  detail?: string;
  error?: string;
};

function buildAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function normalizeTrack(
  track: NonNullable<TracksApiResponse["tracks"]>[number]
): TrackSearchResult {
  return {
    id: track.mb_id,
    artistId: track.artist_mb_id,
    artistName: track.artist_name,
    title: track.title,
    releaseTitle: track.release_title ?? null,
    lengthMs: track.length_ms ?? null,
  };
}

export async function searchTracks(
  userId: string,
  title: string,
  limit = 5
): Promise<TrackSearchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/tracks/search?title=${encodeURIComponent(title.trim())}&user_id=${encodeURIComponent(userId)}&limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
    }
  );

  const data = (await response.json()) as TracksApiResponse;

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to search songs right now."
    );
  }

  if (typeof data?.error === "string") {
    throw new Error(data.error);
  }

  return (data.tracks ?? []).map(normalizeTrack);
}

export async function getUserTracks(
  userId: string,
  token: string
): Promise<TrackSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/tracks`, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  const data = (await response.json()) as TracksApiResponse;

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to load saved songs."
    );
  }

  return (data.tracks ?? []).map(normalizeTrack);
}

export async function addTrackToUser(
  userId: string,
  token: string,
  track: TrackSearchResult
) {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/add_track`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({
      mb_id: track.id,
      artist_mb_id: track.artistId,
      artist_name: track.artistName,
      title: track.title,
      release_title: track.releaseTitle,
      length_ms: track.lengthMs,
    }),
  });

  const data = (await response.json()) as { detail?: string; message?: string };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to save song."
    );
  }

  return data;
}

export async function removeTrackFromUser(
  userId: string,
  token: string,
  trackId: string
) {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/tracks/${trackId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });

  const data = (await response.json()) as { detail?: string; message?: string };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to remove song."
    );
  }

  return data;
}
