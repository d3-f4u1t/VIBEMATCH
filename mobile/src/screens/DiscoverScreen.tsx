import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useFonts } from "expo-font";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";

import { getMatches, type MatchResult } from "../lib/matching";
import type { TokenResponse } from "../types/auth";

type DiscoverScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
};

export function DiscoverScreen({ session, onSignOut }: DiscoverScreenProps) {
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadMatches = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMatches(session.user.id);

        if (!isCancelled) {
          setMatches(data);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load discover right now."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadMatches();

    return () => {
      isCancelled = true;
    };
  }, [session.user.id]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.fixedTopPanelWrap, { paddingTop: topInset }]}>
        <View style={[styles.topPanel, { width: contentWidth }]}>
          <View style={styles.titleWrap}>
            <Text style={styles.topPanelTitle}>Discover</Text>
            <Text style={styles.topPanelSubcopy}>your strongest music matches</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.iconGhost,
              pressed && styles.iconGhostPressed,
            ]}
            onPress={onSignOut}
          >
            <Text style={styles.iconGhostText}>x</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 94,
            paddingBottom: 28,
          },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={[styles.content, { width: contentWidth }]}>
          <Text style={styles.kicker}>Live matching</Text>
          <Text style={styles.title}>
            {matches.length > 0
              ? "People whose taste already lines up with yours."
              : "Your music profile is ready. Now let’s find your people."}
          </Text>

          <View style={[styles.summaryCard, styles.sectionSpacing]}>
            <Text style={styles.summaryLabel}>Profile ready</Text>
            <Text style={styles.summaryName}>{session.user.name}</Text>
            <Text style={styles.summaryBody}>
              Your onboarding is complete and your music vector is active.
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator size="small" color="#82F7A6" />
              <Text style={styles.loadingText}>Loading your discover feed...</Text>
            </View>
          ) : error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Discover is warming up</Text>
              <Text style={styles.emptyBody}>{error}</Text>
            </View>
          ) : matches.length > 0 ? (
            <View style={styles.matchList}>
              {matches.map((match, index) => (
                <View key={match.userId} style={styles.matchCard}>
                  <View style={styles.matchCardHeader}>
                    <View style={styles.matchAvatar}>
                      <Text style={styles.matchAvatarText}>
                        {match.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.matchMeta}>
                      <Text style={styles.matchName}>{match.name}</Text>
                      <Text style={styles.matchScore}>
                        {`${Math.round(match.similarity * 100)}% music match`}
                      </Text>
                    </View>
                    <View style={styles.matchBadge}>
                      <Text style={styles.matchBadgeText}>{index + 1}</Text>
                    </View>
                  </View>

                  <Text style={styles.matchReason}>{match.matchReason}</Text>

                  {match.sharedArtists.length > 0 ? (
                    <View style={styles.chipRow}>
                      {match.sharedArtists.slice(0, 3).map((artist) => (
                        <View key={artist} style={[styles.chip, styles.chipPink]}>
                          <Text style={styles.chipText}>{artist}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {match.sharedTracks.length > 0 ? (
                    <View style={styles.chipRow}>
                      {match.sharedTracks.slice(0, 2).map((track) => (
                        <View key={track} style={[styles.chip, styles.chipMint]}>
                          <Text style={styles.chipText}>{track}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No matches yet</Text>
              <Text style={styles.emptyBody}>
                As more completed users join, your discover feed will start filling up here.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  fixedTopPanelWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center",
    backgroundColor: "rgba(13,10,17,0.12)",
  },
  topPanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
  },
  titleWrap: {
    gap: 4,
  },
  topPanelTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -0.5,
  },
  topPanelSubcopy: {
    color: "rgba(255,248,251,0.56)",
    fontSize: 12,
    textTransform: "lowercase",
    fontFamily: "SpaceGrotesk_500Medium",
  },
  iconGhost: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGhostPressed: {
    opacity: 0.8,
  },
  iconGhostText: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  content: {
    minHeight: "100%",
  },
  kicker: {
    color: "rgba(255,248,251,0.72)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.6,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 31,
    letterSpacing: -1.2,
    fontFamily: "SpaceGrotesk_700Bold",
    maxWidth: 320,
  },
  sectionSpacing: {
    marginBottom: 14,
  },
  summaryCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  summaryLabel: {
    color: "rgba(255,248,251,0.60)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  summaryName: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  summaryBody: {
    color: "rgba(255,248,251,0.68)",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  loadingCard: {
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "rgba(255,248,251,0.72)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  emptyCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  emptyBody: {
    color: "rgba(255,248,251,0.68)",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  matchList: {
    gap: 14,
  },
  matchCard: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  matchCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  matchAvatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(255,79,136,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  matchAvatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  matchMeta: {
    flex: 1,
  },
  matchName: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 4,
  },
  matchScore: {
    color: "rgba(130,247,166,0.90)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  matchBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  matchBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  matchReason: {
    color: "rgba(255,248,251,0.74)",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_400Regular",
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  chip: {
    height: 28,
    borderRadius: 999,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipPink: {
    backgroundColor: "rgba(255,79,136,0.20)",
  },
  chipMint: {
    backgroundColor: "rgba(130,247,166,0.18)",
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
