import { startTransition, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { AuthScreen } from "./src/screens/AuthScreen";
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
        <View style={styles.successScreen}>
          <View style={styles.successCard}>
            <Text style={styles.successEyebrow}>Authenticated</Text>
            <Text style={styles.successTitle}>
              {`Welcome, ${session.user.name}.`}
            </Text>
            <Text style={styles.successBody}>
              Your mobile app is now talking to the real FastAPI auth routes.
              The next step is sending you into music onboarding instead of
              stopping here.
            </Text>
            <Text style={styles.successMeta}>
              {`Signed in as ${session.user.email}`}
            </Text>

            <Pressable style={styles.signOutButton} onPress={handleSignOut}>
              <Text style={styles.signOutButtonText}>Sign out</Text>
            </Pressable>
          </View>
        </View>
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
  successScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  successCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    padding: 24,
  },
  successEyebrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6EA0F8",
    textTransform: "uppercase",
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    color: "#17181C",
    marginBottom: 12,
  },
  successBody: {
    fontSize: 16,
    lineHeight: 24,
    color: "#667085",
    marginBottom: 14,
  },
  successMeta: {
    fontSize: 14,
    lineHeight: 21,
    color: "#344054",
    marginBottom: 20,
  },
  signOutButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#17181C",
    justifyContent: "center",
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
