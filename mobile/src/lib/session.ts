/**
 * session.ts
 * Secure persistence layer for the auth session using expo-secure-store.
 *
 * The JWT token is stored encrypted on-device so the user stays logged in
 * across app restarts. On iOS this uses the Keychain; on Android it uses
 * the Android Keystore system.
 */

import * as SecureStore from "expo-secure-store";
import type { TokenResponse } from "../types/auth";

const SESSION_KEY = "vibematch_session";

/**
 * Persist the full session (token + user) securely on-device.
 */
export async function saveSession(session: TokenResponse): Promise<void> {
  try {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.warn("[session] Failed to save session to SecureStore:", err);
  }
}

/**
 * Load a previously persisted session. Returns null if none exists or if
 * the stored data is corrupted / expired.
 */
export async function loadSession(): Promise<TokenResponse | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TokenResponse;
    // Basic shape validation — if either field is missing discard the cache
    if (!parsed?.access_token || !parsed?.user?.id) return null;
    return parsed;
  } catch (err) {
    console.warn("[session] Failed to load session from SecureStore:", err);
    return null;
  }
}

/**
 * Remove the persisted session (call this on sign-out).
 */
export async function clearSession(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  } catch (err) {
    console.warn("[session] Failed to clear session from SecureStore:", err);
  }
}
