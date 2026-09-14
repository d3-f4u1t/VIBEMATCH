function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  // No hardcoded LAN IP: fail loudly in dev so nobody ships a 10.x URL to TestFlight/Play.
  // Set EXPO_PUBLIC_API_BASE_URL=https://api.yourdomain.com in EAS / .env (gitignored).
  if (__DEV__) {
    throw new Error(
      "EXPO_PUBLIC_API_BASE_URL is not set. Create mobile/.env with EXPO_PUBLIC_API_BASE_URL=http://<your-lan-ip>:8000 for local dev."
    );
  }
  throw new Error("EXPO_PUBLIC_API_BASE_URL is not configured for this build.");
}

export const API_BASE_URL = resolveApiBaseUrl();
