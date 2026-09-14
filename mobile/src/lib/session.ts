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
    if (isTokenExpired(parsed.access_token)) {
      await SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
      return null;
    }
    return parsed;
  } catch (err) {
    console.warn("[session] Failed to load session from SecureStore:", err);
    return null;
  }
}

/** Best-effort JWT exp check (no signature verify — backend is source of truth). */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { exp?: number };
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return false;
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
