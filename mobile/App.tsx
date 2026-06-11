
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import * as NavigationBar from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import {
  Animated,
  Easing,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";

import { FluidBackground } from "./src/components/FluidBackground";
import { AuthScreen } from "./src/screens/AuthScreen";
import { DiscoverScreen } from "./src/screens/DiscoverScreen";
import { MusicSetupScreen } from "./src/screens/MusicFlowScreen";
import { ProfileSetupScreen } from "./src/screens/ProfileSetupScreen";
import type { TokenResponse } from "./src/types/auth";

type AppStage = "auth" | "profile" | "music" | "discover";

export default function App() {
  const [session, setSession] = useState<TokenResponse | null>(null);
  const [stage, setStage] = useState<AppStage>("auth");
  const screenMotion = useRef(new Animated.Value(1)).current;
  const isAuthStage = !session || stage === "auth";

  const handleAuthenticated = (result: TokenResponse) => {
    startTransition(() => {
      setSession(result);
      setStage("profile");
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
      NavigationBar.setPositionAsync("absolute").catch(() => {});
      NavigationBar.setBackgroundColorAsync("#00000000").catch(() => {});
      NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => {});
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
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
        {isAuthStage ? (
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
          <DiscoverScreen session={session} onSignOut={handleSignOut} />
        )}
      </Animated.View>
      <StatusBar style="light" hidden={false} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0E0A11",
  },
  content: {
    flex: 1,
  },
});
