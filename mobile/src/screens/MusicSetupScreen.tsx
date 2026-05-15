import { Platform, Pressable, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import type { TokenResponse } from "../types/auth";

type MusicSetupScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
};

export function MusicSetupScreen({
  session,
  onSignOut,
}: MusicSetupScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.fixedTopPanelWrap, { paddingTop: topInset }]}>
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View>
            <Text style={styles.topPanelEyebrow}>Music setup</Text>
            <Text style={styles.topPanelTitle}>Build your taste profile</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.signOutGhost,
              pressed && styles.ghostPressed,
            ]}
            onPress={onSignOut}
          >
            <Text style={styles.signOutGhostText}>Sign out</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 110,
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>Next milestone</Text>
            <Text style={styles.heroTitle}>Start with the artists that define you.</Text>
            <Text style={styles.heroBody}>
              Your first matches will be shaped by what you actually listen to,
              not just what you type into a bio.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Artists first</Text>
            <Text style={styles.sectionBody}>
              Search artists, add up to 5, and let the backend start building
              your music vector from real selections.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Then songs</Text>
            <Text style={styles.sectionBody}>
              After artists, you will add standout tracks so the system can
              anchor taste with higher precision.
            </Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>Signed in as</Text>
            <Text style={styles.metaValue}>{session.user.email}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F7F6F4",
  },
  fixedTopPanelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "#F7F6F4",
  },
  topPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 16,
  },
  topPanelEyebrow: {
    color: "#6EA0F8",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 4,
  },
  topPanelTitle: {
    color: "#17181C",
    fontSize: 21,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.3,
  },
  signOutGhost: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  signOutGhostText: {
    color: "#344054",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  ghostPressed: {
    opacity: 0.8,
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  heroCard: {
    borderRadius: 32,
    backgroundColor: "#11131A",
    padding: 22,
    marginBottom: 16,
  },
  heroEyebrow: {
    color: "#6EA0F8",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 37,
    letterSpacing: -0.8,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 12,
    maxWidth: 300,
  },
  heroBody: {
    color: "#D0D5DD",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  sectionCard: {
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E4E6EB",
    padding: 18,
    marginBottom: 14,
  },
  sectionTitle: {
    color: "#17181C",
    fontSize: 18,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  sectionBody: {
    color: "#667085",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  metaCard: {
    borderRadius: 22,
    backgroundColor: "#EEF4FF",
    padding: 16,
  },
  metaLabel: {
    color: "#475467",
    fontSize: 12,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 6,
  },
  metaValue: {
    color: "#17181C",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
