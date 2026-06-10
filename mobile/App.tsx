

import { startTransition, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, View } from "react-native";

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

  return (
    <SafeAreaView style={styles.screen}>
      {!isAuthStage ? <FluidBackground /> : null}
      <View style={styles.content}>
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
      </View>
      <StatusBar style="light" />
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
