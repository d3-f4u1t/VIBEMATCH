
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import {
  Alert,
  Animated,
  BackHandler,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { FluidBackground } from "./src/components/FluidBackground";
import { AuthScreen } from "./src/screens/AuthScreen";
import { MainScreen } from "./src/screens/MainScreen";
import { MusicSetupScreen } from "./src/screens/MusicFlowScreen";
import { ProfileSetupScreen } from "./src/screens/ProfileSetupScreen";
import { getMusicProfileStatus, getUserProfile } from "./src/lib/profile";
import { saveSession, loadSession, clearSession } from "./src/lib/session";
import type { TokenResponse } from "./src/types/auth";
import type { UserProfileResponse } from "./src/types/auth";

type AppStage = "boot" | "auth" | "checking" | "profile" | "music" | "discover";

export default function App() {
  const [session, setSession] = useState<TokenResponse | null>(null);
  // Start in "boot" so we can attempt to rehydrate from SecureStore first
  const [stage, setStage] = useState<AppStage>("boot");
  const screenMotion = useRef(new Animated.Value(1)).current;

  const isAuthStage = !session || stage === "auth";
  const isBooting = stage === "boot" || stage === "checking";

  // ── Rehydrate session from SecureStore on first mount ──────────────────────
  useEffect(() => {
    let cancelled = false;

    const rehydrate = async () => {
      const cached = await loadSession();
      if (cancelled) return;

      if (cached) {
        setSession(cached);
        setStage("checking");
      } else {
        setStage("auth");
      }
    };

    void rehydrate();
    return () => { cancelled = true; };
  }, []);

  const handleAuthenticated = (result: TokenResponse) => {
    startTransition(() => {
      setSession(result);
      setStage("checking");
    });
    // Persist session so user stays logged in across restarts
    void saveSession(result);
  };

  const handleProfileComplete = () => {
    setStage("music");
  };

  const handleSignOut = () => {
    void clearSession();
    setSession(null);
    setStage("auth");
  };

  const handleMusicComplete = () => {
    setStage("discover");
  };

  const hasCompleteProfile = (profile: UserProfileResponse) => {
    const requiredValues = [
      profile.name,
      profile.date_of_birth,
      profile.pronouns,
      profile.gender,
      profile.sexuality,
      profile.location_city,
      profile.bio,
      profile.height,
      profile.weight,
      profile.ethnicity,
      profile.z_sign,
      profile.f_plan,
      profile.pets,
      profile.religion,
    ];

    const habits = profile.habit;
    const prefs = profile as unknown as {
      age_min?: number | null;
      age_max?: number | null;
      intent?: string | null;
    };

    return (
      requiredValues.every((value) => !!value && value.toString().trim().length > 0) &&
      !!habits &&
      !!habits.smoking?.trim() &&
      !!habits.drinking?.trim() &&
      !!habits.weed?.trim() &&
      prefs.age_min != null &&
      prefs.age_max != null &&
      !!prefs.intent?.trim()
    );
  };

  // ── Resolve onboarding stage after auth ───────────────────────────────────
  useEffect(() => {
    if (!session || stage !== "checking") {
      return;
    }

    let cancelled = false;

    const resolveStage = async () => {
      try {
        const profile = await getUserProfile(session.user.id, session.access_token);

        if (cancelled) return;

        if (!hasCompleteProfile(profile)) {
          setStage("profile");
          return;
        }

        const musicStatus = await getMusicProfileStatus(
          session.user.id,
          session.access_token
        );

        if (cancelled) return;

        setStage(musicStatus.music_profile_complete ? "discover" : "music");
      } catch (err) {
        if (!cancelled) {
          // If session is stale/invalid, clear it and go back to auth
          const message = err instanceof Error ? err.message : "";
          if (message.toLowerCase().includes("401") || message.toLowerCase().includes("unauthorized")) {
            void clearSession();
            setSession(null);
            setStage("auth");
          } else {
            setStage("profile");
          }
        }
      }
    };

    void resolveStage();

    return () => {
      cancelled = true;
    };
  }, [session, stage]);

  const backgroundVariant =
    stage === "profile"
      ? "profile"
      : stage === "music"
        ? "music"
        : "discover";

  const screenKey = useMemo(
    () => (isAuthStage || stage === "boot" ? "auth" : stage),
    [isAuthStage, stage]
  );

  useEffect(() => {
    screenMotion.setValue(0);

    Animated.parallel([
      Animated.timing(screenMotion, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [screenKey, screenMotion]);

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }
    // SDK 57: expo-navigation-bar legacy APIs (setPositionAsync/setBackgroundColorAsync/setBehaviorAsync) were removed.
    // edgeToEdgeEnabled in app.json now handles this. Keep a safe no-op for older code paths.
    const applyNavigationBarState = () => {
      // @ts-ignore - SDK57 stubs these to warnings; guard for safety
      (NavigationBar as any).setVisibilityAsync?.("visible")?.catch?.(() => {});
    };

    applyNavigationBarState();
    const timeoutId = setTimeout(applyNavigationBarState, 250);

    return () => clearTimeout(timeoutId);
  }, [screenKey]);

  // Hardware back: let active screen handle first, otherwise handle stage
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // If on discover, let MainScreen's handler deal with tabs/detail
      // For profile/music, go back to previous stage if user is deep in onboarding
      if (stage === "music") {
        setStage("profile");
        return true;
      }
      if (stage === "profile") {
        // Don't pop to auth automatically - stay, the Profile screen handles step back
        return false;
      }
      return false;
    });
    return () => sub.remove();
  }, [stage]);

  const screenAnimatedStyle = {
    opacity: screenMotion,
    transform: [
      {
        translateX: screenMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        translateY: screenMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <FluidBackground variant={backgroundVariant} />
        <Animated.View style={[styles.content, screenAnimatedStyle]}>
          {isBooting ? (
            <View style={styles.bootScreen}>
              <Text style={styles.bootTitle}>
                {stage === "boot" ? "Loading…" : "Checking your account…"}
              </Text>
              <Text style={styles.bootSubtext}>
                {stage === "boot"
                  ? "Starting VibeMatch"
                  : "Loading your saved profile and matching setup."}
              </Text>
            </View>
          ) : isAuthStage ? (
            <AuthScreen onAuthenticated={handleAuthenticated} />
          ) : stage === "profile" ? (
            <ProfileSetupScreen
              session={session}
              onSignOut={handleSignOut}
              onComplete={handleProfileComplete}
            />
          ) : stage === "music" ? (
            <MusicSetupScreen
              session={session}
              onSignOut={handleSignOut}
              onComplete={handleMusicComplete}
            />
          ) : (
            <MainScreen session={session} onSignOut={handleSignOut} />
          )}
        </Animated.View>
        <StatusBar style="dark" hidden={false} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
  },
  bootScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  bootTitle: {
    color: "#0b0b0c",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  bootSubtext: {
    color: "rgba(11,11,12,0.66)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
    textAlign: "center",
    maxWidth: 280,
  },
});
