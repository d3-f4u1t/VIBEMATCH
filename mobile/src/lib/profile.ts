import type {
  UserProfileResponse,
  UserProfileUpdatePayload,
} from "../types/auth";

import {API_BASE_URL} from "./config"
//just use this url for this
// http://192.168.43.214:8000
// this is a public url that is saved in the .config file as it keeps it comman

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json();

  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return data as T;
}

function buildAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function getUserProfile(
  userId: string,
  token: string
): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  return parseJson<UserProfileResponse>(response);
}

export async function updateUserProfile(
  userId: string,
  token: string,
  payload: UserProfileUpdatePayload
): Promise<UserProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/profile`, {
    method: "PATCH",
    headers: buildAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  return parseJson<UserProfileResponse>(response);
}

type MusicProfileStatusResponse = {
  user_id: string;
  artist_count: number;
  track_count: number;
  artists_complete: boolean;
  tracks_complete: boolean;
  music_profile_complete: boolean;
  artists_rem_to_min: number;
  tracks_rem_to_min: number;
};

export async function getMusicProfileStatus(
  userId: string,
  token: string
): Promise<MusicProfileStatusResponse> {
  const response = await fetch(
    `${API_BASE_URL}/user/${userId}/music-profile-status`,
    {
      method: "GET",
      headers: buildAuthHeaders(token),
    }
  );

  return parseJson<MusicProfileStatusResponse>(response);
}
