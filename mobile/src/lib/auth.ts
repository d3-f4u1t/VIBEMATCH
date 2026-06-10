import type {
  LoginPayload,
  RegisterPayload,
  TokenResponse,
} from "../types/auth";

const API_BASE_URL = "http://192.168.1.37:8000";
// use url which is hosting the backend changes if the backend and front end is running on the same device
// Example: http://192.168.1.5:8000

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

export async function registerUser(
  payload: RegisterPayload
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<TokenResponse>(response);
}

export async function loginUser(
  payload: LoginPayload
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return parseJson<TokenResponse>(response);
}
