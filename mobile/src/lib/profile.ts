import type {
  UserProfileResponse,
  UserProfileUpdatePayload,
} from "../types/auth";

const API_BASE_URL = "http://192.168.1.37:8000";
//just use this url for this
// http://192.168.43.214:8000

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
