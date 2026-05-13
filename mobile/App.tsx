//for strating the app use this
//for npm:
// & "C:\Program Files\nodejs\npm.cmd" run start



import { startTransition, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";

import { AuthScreen } from "./src/screens/AuthScreen";
import { ProfileSetupScreen } from "./src/screens/ProfileSetupScreen";
import type { TokenResponse } from "./src/types/auth";

export default function App() {
  const [session, setSession] = useState<TokenResponse | null>(null);

  const handleAuthenticated = (result: TokenResponse) => {
    startTransition(() => {
      setSession(result);
    });
  };

  const handleSignOut = () => {
    setSession(null);
  };

  return (
    <SafeAreaView style={styles.screen}>
      {session ? (
        <ProfileSetupScreen session={session} onSignOut={handleSignOut} />
      ) : (
        <AuthScreen onAuthenticated={handleAuthenticated} />
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
