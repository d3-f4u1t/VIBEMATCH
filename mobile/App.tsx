import { startTransition, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

import { AuthScreen } from "./src/screens/AuthScreen";
import { MusicSetupScreen } from "./src/screens/MusicSetupScreen";
import { ProfileSetupScreen } from "./src/screens/ProfileSetupScreen";
import type { TokenResponse } from "./src/types/auth";

type AppStage = "auth" | "profile" | "music";

export default function App() {
  const [session, setSession] = useState<TokenResponse | null>(null);
  const [stage, setStage] = useState<AppStage>("auth");

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

  return (
    <SafeAreaView style={styles.screen}>
      {!session || stage === "auth" ? (
        <AuthScreen onAuthenticated={handleAuthenticated} />
      ) : stage === "profile" ? (
        <ProfileSetupScreen
          session={session}
          onSignOut={handleSignOut}
          onComplete={handleProfileComplete}
        />
      ) : (
        <MusicSetupScreen session={session} onSignOut={handleSignOut} />
      )}
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F6F4",
  },
});
