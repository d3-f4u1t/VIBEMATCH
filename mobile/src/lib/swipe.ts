import { API_BASE_URL } from "./config";
import type { MatchResult } from "./matching";

export type SwipeAction = "like" | "pass" | "super_like";

type NextMatchApiResponse = {
  user_id: string;
  name: string;
  bio: string;
  location_city: string;
  artist_count: number;
  track_count: number;
  similarity: number;
  shared_artists: string[];
  shared_tracks: string[];
  match_reason: string;
  pronouns?: string;
  gender?: string;
  sexuality?: string;
  height?: string;
  weight?: string;
  ethnicity?: string;
  z_sign?: string;
  f_plan?: string;
  pets?: string;
  religion?: string;
  habit?: {
    smoking?: string;
    drinking?: string;
    weed?: string;
  };
  detail?: string;
};

type SwipeApiResponse = {
  detail?: string;
};

type MutualMatchApiItem = {
  user_id: string;
  name: string;
  bio: string;
  location_city: string;
  matched_at: string;
  pronouns?: string;
  gender?: string;
  sexuality?: string;
  height?: string;
  weight?: string;
  ethnicity?: string;
  z_sign?: string;
  f_plan?: string;
  pets?: string;
  religion?: string;
  habit?: {
    smoking?: string;
    drinking?: string;
    weed?: string;
  };
};

type MutualMatchesApiResponse = {
  matches?: MutualMatchApiItem[];
  detail?: string;
};

export type MutualMatch = {
  userId: string;
  name: string;
  bio: string;
  locationCity: string;
  matchedAt: string;
  pronouns?: string;
  gender?: string;
  sexuality?: string;
  height?: string;
  weight?: string;
  ethnicity?: string;
  zSign?: string;
  fPlan?: string;
  pets?: string;
  religion?: string;
  habit?: {
    smoking?: string;
    drinking?: string;
    weed?: string;
  };
};

function buildAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "detail" in data &&
    typeof (data as { detail?: unknown }).detail === "string"
  ) {
    return (data as { detail: string }).detail;
  }

  return fallback;
}

function mapNextMatch(data: NextMatchApiResponse): MatchResult {
  return {
    userId: data.user_id,
    name: data.name,
    bio: data.bio ?? "",
    locationCity: data.location_city ?? "",
    similarity: data.similarity,
    artistCount: data.artist_count,
    trackCount: data.track_count,
    sharedArtists: data.shared_artists ?? [],
    sharedTracks: data.shared_tracks ?? [],
    matchReason: data.match_reason,
    pronouns: data.pronouns,
    gender: data.gender,
    sexuality: data.sexuality,
    height: data.height,
    weight: data.weight,
    ethnicity: data.ethnicity,
    zSign: data.z_sign,
    fPlan: data.f_plan,
    pets: data.pets,
    religion: data.religion,
    habit: data.habit,
  };
}

export async function getNextMatch(
  userId: string,
  token: string
): Promise<MatchResult | null> {
  const response = await fetch(
    `${API_BASE_URL}/swipe/next/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (response.status === 404) {
    return null;
  }

  const data = (await response.json()) as NextMatchApiResponse;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to load the next profile."));
  }

  return mapNextMatch(data);
}

export async function createSwipe(
  swipedUserId: string,
  action: SwipeAction,
  token: string
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/swipe/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      swiped_user_id: swipedUserId,
      action,
    }),
  });

  if (response.status === 204) {
    return;
  }

  const data = (await response.json()) as SwipeApiResponse;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to save your swipe."));
  }
}

export async function getMutualMatches(
  userId: string,
  token: string
): Promise<MutualMatch[]> {
  const response = await fetch(
    `${API_BASE_URL}/swipe/mutual/${encodeURIComponent(userId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = (await response.json()) as MutualMatchesApiResponse;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to load mutual matches."));
  }

  return (data.matches ?? []).map((match) => ({
    userId: match.user_id,
    name: match.name,
    bio: match.bio,
    locationCity: match.location_city,
    matchedAt: match.matched_at,
    pronouns: match.pronouns,
    gender: match.gender,
    sexuality: match.sexuality,
    height: match.height,
    weight: match.weight,
    ethnicity: match.ethnicity,
    zSign: match.z_sign,
    fPlan: match.f_plan,
    pets: match.pets,
    religion: match.religion,
    habit: match.habit,
  }));
}
