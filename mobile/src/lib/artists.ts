import {API_BASE_URL} from "./config"

type ArtistSearchApiResponse = {
  artists?: Array<{
    mb_id: string;
    name: string;
    country?: string | null;
    type?: string | null;
    disambiguation?: string | null;
    tags?: string[];
    score?: number | string | null;
  }>;
  error?: string;
};

export type ArtistSearchResult = {
  id: string;
  name: string;
  meta: string;
  gradientStart: string;
  gradientEnd: string;
  country?: string | null;
  tags?: string[];
  artistType?: string | null;
};

type UserArtistsResponse = {
  artists: Array<{
    mb_id: string;
    name: string;
    tags?: string[];
  }>;
};

function buildAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

function buildArtistMeta(artist: NonNullable<ArtistSearchApiResponse["artists"]>[number]) {
  const parts = [
    artist.type?.trim(),
    artist.country?.trim(),
    artist.disambiguation?.trim(),
    ...(artist.tags ?? []).slice(0, 2),
  ].filter((value): value is string => Boolean(value && value.length > 0));

  if (parts.length > 0) {
    return parts.join(" · ");
  }

  return "music artist";
}

function buildArtistGradient(index: number) {
  const palette = [
    ["rgba(255,79,136,0.86)", "rgba(255,122,89,0.76)"],
    ["rgba(130,247,166,0.86)", "rgba(255,79,136,0.72)"],
    ["rgba(126,95,255,0.82)", "rgba(255,122,89,0.72)"],
    ["rgba(255,122,89,0.80)", "rgba(255,79,136,0.76)"],
    ["rgba(92,214,255,0.80)", "rgba(126,95,255,0.72)"],
  ];

  const [gradientStart, gradientEnd] = palette[index % palette.length];
  return { gradientStart, gradientEnd };
}

function hashIndex(value: string, size: number) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % size;
}

function buildGradientForArtistKey(key: string) {
  return buildArtistGradient(hashIndex(key, 5));
}

function normalizeSavedArtist(artist: UserArtistsResponse["artists"][number]): ArtistSearchResult {
  return {
    id: artist.mb_id,
    name: artist.name,
    meta:
      artist.tags && artist.tags.length > 0
        ? artist.tags.slice(0, 3).join(" · ")
        : "music artist",
    tags: artist.tags ?? [],
    ...buildGradientForArtistKey(artist.mb_id || artist.name),
  };
}

export async function searchArtists(term: string): Promise<ArtistSearchResult[]> {
  const response = await fetch(
    `${API_BASE_URL}/search?name=${encodeURIComponent(term.trim())}`,
    {
      method: "GET",
    }
  );

  const data = (await response.json()) as ArtistSearchApiResponse;

  if (!response.ok) {
    const message =
      typeof data?.error === "string"
        ? data.error
        : "Unable to search artists right now.";
    throw new Error(message);
  }

  if (typeof data?.error === "string") {
    throw new Error(data.error);
  }

  return (data.artists ?? []).map((artist, index) => ({
    id: artist.mb_id,
    name: artist.name,
    meta: buildArtistMeta(artist),
    country: artist.country ?? null,
    tags: artist.tags ?? [],
    artistType: artist.type ?? null,
    ...buildArtistGradient(index),
  }));
}

export async function getUserArtists(
  userId: string,
  token: string
): Promise<ArtistSearchResult[]> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/artists`, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  const data = (await response.json()) as UserArtistsResponse & { detail?: string };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to load saved artists."
    );
  }

  return (data.artists ?? []).map(normalizeSavedArtist);
}

export async function addArtistToUser(
  userId: string,
  token: string,
  artist: ArtistSearchResult
) {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/add_artist`, {
    method: "POST",
    headers: buildAuthHeaders(token),
    body: JSON.stringify({
      mb_id: artist.id,
      name: artist.name,
      country: artist.country ?? null,
      tags: artist.tags ?? [],
      artist_type: artist.artistType ?? null,
    }),
  });

  const data = (await response.json()) as { detail?: string; message?: string };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to save artist."
    );
  }

  return data;
}

export async function removeArtistFromUser(
  userId: string,
  token: string,
  artistId: string
) {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/artists/${artistId}`, {
    method: "DELETE",
    headers: buildAuthHeaders(token),
  });

  const data = (await response.json()) as { detail?: string; message?: string };

  if (!response.ok) {
    throw new Error(
      typeof data?.detail === "string"
        ? data.detail
        : "Unable to remove artist."
    );
  }

  return data;
}
