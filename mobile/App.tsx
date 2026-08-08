
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FluidBackground } from "./src/components/FluidBackground";
import { AuthScreen } from "./src/screens/AuthScreen";
import { MainScreen } from "./src/screens/MainScreen";
import { MusicSetupScreen } from "./src/screens/MusicFlowScreen";
import { ProfileSetupScreen } from "./src/screens/ProfileSetupScreen";
import { getMusicProfileStatus, getUserProfile } from "./src/lib/profile";
import type { TokenResponse } from "./src/types/auth";
import type { UserProfileResponse } from "./src/types/auth";

type AppStage = "auth" | "checking" | "profile" | "music" | "discover";

export default function App() {
  const [session, setSession] = useState<TokenResponse | null>(null);
  const [stage, setStage] = useState<AppStage>("auth");
  const screenMotion = useRef(new Animated.Value(1)).current;
  const isAuthStage = !session || stage === "auth";
  const isBooting = stage === "checking";

  const handleAuthenticated = (result: TokenResponse) => {
    startTransition(() => {
      setSession(result);
      setStage("checking");
    });
  };

  const handleProfileComplete = () => {
    setStage("music");
  };

  const handleSignOut = () => {
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

    return (
      requiredValues.every((value) => !!value && value.toString().trim().length > 0) &&
      !!habits &&
      !!habits.smoking?.trim() &&
      !!habits.drinking?.trim() &&
      !!habits.weed?.trim()
    );
  };

  useEffect(() => {
    if (!session || stage !== "checking") {
      return;
    }

    let cancelled = false;

    const resolveStage = async () => {
      try {
        const profile = await getUserProfile(session.user.id, session.access_token);

        if (cancelled) {
          return;
        }

        if (!hasCompleteProfile(profile)) {
          setStage("profile");
          return;
        }

        const musicStatus = await getMusicProfileStatus(
          session.user.id,
          session.access_token
        );

        if (cancelled) {
          return;
        }

        setStage(musicStatus.music_profile_complete ? "discover" : "music");
      } catch {
        if (!cancelled) {
          setStage("profile");
        }
      }
    };

    resolveStage();

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
    () => (isAuthStage ? "auth" : stage),
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

    const applyNavigationBarState = () => {
      NavigationBar.setPositionAsync("relative").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#09070D").catch(() => {});
      NavigationBar.setBehaviorAsync("inset-swipe").catch(() => {});
      NavigationBar.setVisibilityAsync("visible").catch(() => {});
    };

    applyNavigationBarState();
    const timeoutId = setTimeout(applyNavigationBarState, 250);

    return () => clearTimeout(timeoutId);
  }, [screenKey]);

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
    <SafeAreaView style={styles.screen}>
      {!isAuthStage ? <FluidBackground variant={backgroundVariant} /> : null}
      <Animated.View style={[styles.content, screenAnimatedStyle]}>
        {isBooting ? (
          <View style={styles.bootScreen}>
            <Text style={styles.bootTitle}>Checking your account...</Text>
            <Text style={styles.bootSubtext}>
              Loading your saved profile and matching setup.
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
      <StatusBar style="light" hidden={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#09070D",
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
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 8,
  },
  bootSubtext: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
    textAlign: "center",
    maxWidth: 280,
  },
});
