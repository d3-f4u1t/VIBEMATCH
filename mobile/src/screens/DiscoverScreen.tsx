import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

type DiscoverTab = "matches" | "detail" | "community" | "nearby";

type FeedCardTone = {
  start: string;
  end: string;
  accent: string;
  orb: string;
};

const FEED_TONES: FeedCardTone[] = [
  {
    start: "#BFD6F3",
    end: "#7B9BC7",
    accent: "#F26A8D",
    orb: "rgba(255, 247, 240, 0.50)",
  },
  {
    start: "#95D8D0",
    end: "#68AEB0",
    accent: "#FF7B59",
    orb: "rgba(255, 236, 227, 0.50)",
  },
  {
    start: "#D9C3F8",
    end: "#9A8CDD",
    accent: "#82F7A6",
    orb: "rgba(248, 243, 255, 0.44)",
  },
];

const COMMUNITY_PEOPLE = [
  { name: "Ava", color: "#F26A8D" },
  { name: "Mae", color: "#82F7A6" },
  { name: "Luna", color: "#BBB0F7" },
  { name: "June", color: "#FF7B59" },
];

const NEARBY_DISTANCES = ["1.5 km", "1.2 km", "2.1 km", "900 m"];

function buildFallbackMatches(currentUserName: string): MatchResult[] {
  return [
    {
      userId: "preview-1",
      name: "Kristin Watson",
      similarity: 0.91,
      artistCount: 4,
      trackCount: 4,
      sharedArtists: ["Frank Ocean", "SZA", "Tyler, The Creator"],
      sharedTracks: ["Nights", "Good Days"],
      matchReason: `The system sees a strong overlap between ${currentUserName}'s late-night listening and Kristin's softer alt-pop taste.`,
    },
    {
      userId: "preview-2",
      name: "Kathryn Murphy",
      similarity: 0.88,
      artistCount: 5,
      trackCount: 4,
      sharedArtists: ["Drake", "Travis Scott", "The Weeknd"],
      sharedTracks: ["MY EYES", "After Hours"],
      matchReason:
        "You both lean into high-energy rap and cinematic night-drive tracks, so the match score stays consistently high.",
    },
    {
      userId: "preview-3",
      name: "Perthvi Laurence",
      similarity: 0.84,
      artistCount: 3,
      trackCount: 4,
      sharedArtists: ["FKA twigs", "James Blake", "Lorde"],
      sharedTracks: ["Cellophane", "Retrograde"],
      matchReason:
        "The vibe overlap is calmer here: introspection, art-pop edges, and slower tracks that usually pair well in conversation-first matches.",
    },
  ];
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function useMatchTone(index: number) {
  return FEED_TONES[index % FEED_TONES.length];
}

export function DiscoverScreen({ session, onSignOut }: DiscoverScreenProps) {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const topInset =
    Platform.OS === "android" ? (NativeStatusBar.currentHeight ?? 0) + 18 : 18;
  const safeBottom = Platform.OS === "ios" ? 26 : 10;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [activeTab, setActiveTab] = useState<DiscoverTab>("matches");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const tabMotion = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isCancelled = false;

    const loadMatches = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMatches(session.user.id);

        if (isCancelled) {
          return;
        }

        setMatches(data);
      } catch (loadError) {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load discover right now."
        );
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

  const fallbackMatches = useMemo(
    () => buildFallbackMatches(session.user.name),
    [session.user.name]
  );
  const displayMatches = matches.length > 0 ? matches : fallbackMatches;
  const usingPreviewData = matches.length === 0;
  const selectedMatch =
    displayMatches.find((match) => match.userId === selectedMatchId) ??
    displayMatches[0] ??
    null;

  useEffect(() => {
    if (!selectedMatchId && displayMatches.length > 0) {
      setSelectedMatchId(displayMatches[0].userId);
    }
  }, [displayMatches, selectedMatchId]);

  useEffect(() => {
    tabMotion.setValue(0);

    Animated.timing(tabMotion, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [activeTab, selectedMatchId, tabMotion]);

  if (!fontsLoaded) {
    return null;
  }

  const tabAnimatedStyle = {
    opacity: tabMotion,
    transform: [
      {
        translateX: tabMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0],
        }),
      },
      {
        translateY: tabMotion.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };

  const heroMatch = displayMatches[0] ?? null;
  const communityFeature = displayMatches[1] ?? heroMatch;
  const nearbyCards = displayMatches.slice(0, 2);

  const handleOpenDetail = (match: MatchResult) => {
    setSelectedMatchId(match.userId);
    setActiveTab("detail");
  };

  const renderInfoBanner = () => {
    if (!usingPreviewData && !error) {
      return null;
    }

    return (
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          {error
            ? `Live matches could not load, so this screen is showing preview concepts.`
            : "Live matches are still light, so this screen is using preview concept data for now."}
        </Text>
      </View>
    );
  };

  const renderTopSection = () => {
    if (activeTab === "matches") {
      return (
        <View style={styles.topSection}>
          <View>
            <Text style={styles.heroTitle}>Matches</Text>
          </View>

          <View style={styles.topActionRow}>
            <Pressable style={styles.topIconButton}>
              <Text style={styles.topIconGlyph}>◦</Text>
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    }

    if (activeTab === "detail") {
      return (
        <View style={styles.topSection}>
          <View style={styles.detailTopRow}>
            <Pressable
              style={styles.topIconButton}
              onPress={() => setActiveTab("matches")}
            >
              <Text style={styles.topIconGlyph}>‹</Text>
            </Pressable>

            <View style={styles.detailProgressTrack}>
              <View style={styles.detailProgressFill} />
            </View>

            <Pressable style={styles.topIconButton}>
              <Text style={styles.topIconGlyph}>◦</Text>
              <View style={styles.badgeDot}>
                <Text style={styles.badgeText}>3</Text>
              </View>
            </Pressable>
          </View>
        </View>
      );
    }

    if (activeTab === "community") {
      return (
        <View style={styles.topSection}>
          <Text style={styles.heroTitleSmaller}>Community</Text>
        </View>
      );
    }

    return (
      <View style={styles.topSection}>
        <Text style={styles.heroTitleSmaller}>Nearby</Text>
      </View>
    );
  };

  const renderMatchesTab = () => {
    if (!heroMatch) {
      return (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No matches yet</Text>
          <Text style={styles.emptyStateBody}>
            Finish building more music signals and your discover feed will start to fill up here.
          </Text>
        </View>
      );
    }

    const tone = useMatchTone(0);

    return (
      <View style={styles.sectionBody}>
        <View style={styles.filterRow}>
          <Pressable style={styles.filterIconButton}>
            <Text style={styles.filterIconGlyph}>≡</Text>
          </Pressable>
          <View style={styles.filterChipRow}>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>All</Text>
            </View>
            <View style={[styles.filterChip, styles.filterChipActive]}>
              <Text style={styles.filterChipTextActive}>New</Text>
            </View>
            <View style={styles.filterChip}>
              <Text style={styles.filterChipText}>Nearby</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.heroCardWrap}
          onPress={() => handleOpenDetail(heroMatch)}
        >
          <LinearGradient
            colors={[tone.start, tone.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroPhotoOrbLarge} />
            <View
              style={[
                styles.heroPhotoBody,
                { backgroundColor: tone.orb, borderColor: `${tone.accent}20` },
              ]}
            />

            <View style={styles.heroOverlay}>
              <Text style={styles.heroOnline}>• Online</Text>
              <View style={styles.heroNameRow}>
                <Text style={styles.heroName}>{heroMatch.name}</Text>
                <Text style={styles.heroAge}>
                  {20 + (Math.round(heroMatch.similarity * 10) % 7)}
                </Text>
              </View>
              <Text style={styles.heroMeta}>USA, California</Text>
            </View>
          </LinearGradient>
        </Pressable>

        <View style={styles.heroActionRow}>
          <Pressable style={styles.roundActionGhost}>
            <Text style={styles.roundActionGhostLabel}>×</Text>
          </Pressable>
          <Pressable style={styles.roundActionPrimary}>
            <Text style={styles.roundActionPrimaryLabel}>♥</Text>
          </Pressable>
          <Pressable style={styles.roundActionGhost}>
            <Text style={styles.roundActionGhostLabel}>◔</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  const renderDetailTab = () => {
    if (!selectedMatch) {
      return null;
    }

    const tone = useMatchTone(
      displayMatches.findIndex((match) => match.userId === selectedMatch.userId)
    );

    return (
      <View style={styles.sectionBody}>
        <View style={styles.detailCard}>
          <LinearGradient
            colors={[tone.start, tone.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.detailPhoto}
          >
            <View style={styles.detailPhotoOrbLarge} />
            <View
              style={[
                styles.detailPhotoAccentShape,
                { backgroundColor: `${tone.accent}CC` },
              ]}
            />
          </LinearGradient>

          <View style={styles.detailOverlay}>
            <Text style={styles.detailOnline}>• Online</Text>
            <View style={styles.detailNameRow}>
              <Text style={styles.detailName}>{selectedMatch.name}</Text>
              <Text style={styles.detailAge}>
                {20 + (Math.round(selectedMatch.similarity * 10) % 7)}
              </Text>
            </View>
            <Text style={styles.detailMeta}>USA, California</Text>

            <View style={styles.detailChipRow}>
              {selectedMatch.sharedArtists.slice(0, 3).map((artist) => (
                <View key={artist} style={styles.detailInterestChip}>
                  <Text style={styles.detailInterestChipText}>
                    {artist.split(" ")[0]}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={styles.detailBioLabel}>Why this match</Text>
            <Text style={styles.detailBioText}>{selectedMatch.matchReason}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCommunityTab = () => {
    return (
      <View style={styles.sectionBody}>
        <View style={styles.searchCard}>
          <Text style={styles.searchPlaceholder}>
            Search by vibe, artist, place
          </Text>
          <Text style={styles.searchAccent}>⌕</Text>
        </View>

        <View style={styles.communityChipRow}>
          <View style={[styles.filterChip, styles.filterChipActive]}>
            <Text style={styles.filterChipTextActive}>For you</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Nearby</Text>
          </View>
          <View style={styles.filterChip}>
            <Text style={styles.filterChipText}>Playlists</Text>
          </View>
        </View>

        <View style={styles.communityStoryCard}>
          <Text style={styles.communityStoryTitle}>Shared energy right now</Text>
          <View style={styles.communityStoryRow}>
            {COMMUNITY_PEOPLE.map((person) => (
              <View key={person.name} style={styles.communityStoryPill}>
                <View
                  style={[
                    styles.communityAvatar,
                    { backgroundColor: person.color },
                  ]}
                />
                <Text style={styles.communityAvatarLabel}>{person.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {communityFeature ? (
          <Pressable
            style={styles.communityFeatureCard}
            onPress={() => handleOpenDetail(communityFeature)}
          >
            <LinearGradient
              colors={["#BFD6F3", "#7B9BC7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.communityFeatureVisual}
            >
              <View style={styles.communityFeatureOverlay} />
              <Pressable style={styles.communityHeartButton}>
                <Text style={styles.communityHeartGlyph}>♥</Text>
              </Pressable>
            </LinearGradient>
            <Text style={styles.communityFeatureName}>{communityFeature.name}</Text>
            <Text style={styles.communityFeatureMeta}>
              {communityFeature.sharedArtists.slice(0, 3).join(" / ")}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  };

  const renderNearbyTab = () => {
    return (
      <View style={styles.sectionBody}>
        <View style={styles.mapCard}>
          <View style={styles.mapLineOne} />
          <View style={styles.mapLineTwo} />
          <View style={styles.mapMarkerOne} />
          <View style={styles.mapMarkerTwo} />
          <Text style={styles.mapPlaceholder}>Map layer</Text>
        </View>

        <View style={styles.nearbyCardsRow}>
          {nearbyCards.map((match, index) => {
            const tone = useMatchTone(index);

            return (
              <Pressable
                key={match.userId}
                style={styles.nearbyMiniCardWrap}
                onPress={() => handleOpenDetail(match)}
              >
                <LinearGradient
                  colors={[tone.start, tone.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.nearbyMiniCard}
                />
                <Text style={styles.nearbyMiniName}>{match.name.split(" ")[0]}</Text>
                <Text style={styles.nearbyMiniDistance}>
                  {NEARBY_DISTANCES[index] ?? "1.4 km"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.contextCard}>
          <Text style={styles.contextCardTitle}>Why these people?</Text>
          <Text style={styles.contextCardBody}>
            Shared late-night artists, city overlap, and matching listening pace
            keep these profiles near the top of your discover stack.
          </Text>
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading && matches.length === 0) {
      return (
        <View style={styles.centerStateCard}>
          <ActivityIndicator size="small" color="#82F7A6" />
          <Text style={styles.centerStateText}>Loading your discover feed...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case "matches":
        return renderMatchesTab();
      case "detail":
        return renderDetailTab();
      case "community":
        return renderCommunityTab();
      case "nearby":
        return renderNearbyTab();
      default:
        return null;
    }
  };

  const navItems: Array<{ key: DiscoverTab; icon: string }> = [
    { key: "matches", icon: "◫" },
    { key: "detail", icon: "◔" },
    { key: "community", icon: "◉" },
    { key: "nearby", icon: "⌕" },
  ];

  const pagePaddingTop = activeTab === "detail" ? topInset + 76 : topInset + 88;
  const pagePaddingBottom = safeBottom + 86;
  const contentMinHeight = Math.max(height - pagePaddingTop - pagePaddingBottom, 520);

  return (
    <View style={styles.screen}>
      <View style={[styles.phoneShell, { width: contentWidth, marginTop: topInset }]}>
        {renderTopSection()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: pagePaddingTop,
              paddingBottom: pagePaddingBottom,
              minHeight: contentMinHeight + pagePaddingTop + pagePaddingBottom,
            },
          ]}
        >
          <View style={styles.innerContent}>
            {renderInfoBanner()}
            <Animated.View style={tabAnimatedStyle}>{renderContent()}</Animated.View>
          </View>
        </ScrollView>

        <View style={[styles.bottomNav, { bottom: safeBottom }]}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key;

            return (
              <Pressable
                key={item.key}
                style={styles.bottomNavItem}
                onPress={() => setActiveTab(item.key)}
              >
                {isActive ? <View style={styles.bottomNavGlow} /> : null}
                <Text
                  style={[
                    styles.bottomNavIcon,
                    isActive && styles.bottomNavIconActive,
                  ]}
                >
                  {item.icon}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.hiddenSignOutHit} onPress={onSignOut}>
          <Text style={styles.hiddenSignOutText}>sign out</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  phoneShell: {
    flex: 1,
    maxWidth: 430,
    borderRadius: 34,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(10,8,12,0.22)",
  },
  topSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    backgroundColor: "rgba(13,10,17,0.08)",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 44,
    letterSpacing: -1.3,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroTitleSmaller: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.1,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  topActionRow: {
    position: "absolute",
    right: 22,
    top: 18,
  },
  topIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  topIconGlyph: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  badgeDot: {
    position: "absolute",
    top: -5,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#82F7A6",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailProgressTrack: {
    flex: 1,
    marginHorizontal: 16,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    overflow: "hidden",
  },
  detailProgressFill: {
    width: "28%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#82F7A6",
  },
  scrollContent: {
    paddingHorizontal: 22,
  },
  innerContent: {
    flex: 1,
  },
  infoBanner: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginBottom: 16,
  },
  infoBannerText: {
    color: "rgba(255,248,251,0.74)",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  centerStateCard: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centerStateText: {
    marginTop: 12,
    color: "rgba(255,248,251,0.74)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  emptyStateCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  emptyStateBody: {
    color: "rgba(255,248,251,0.70)",
    fontSize: 13,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  sectionBody: {
    gap: 16,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  filterIconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  filterIconGlyph: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  filterChipRow: {
    flexDirection: "row",
    gap: 10,
  },
  filterChip: {
    minWidth: 68,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterChipActive: {
    backgroundColor: "#F26A8D",
    borderColor: "rgba(255,123,89,0.28)",
  },
  filterChipText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroCardWrap: {
    borderRadius: 30,
    overflow: "hidden",
  },
  heroCard: {
    height: 392,
    borderRadius: 30,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  heroPhotoOrbLarge: {
    position: "absolute",
    top: 108,
    left: 96,
    width: 138,
    height: 138,
    borderRadius: 69,
    backgroundColor: "rgba(255,247,240,0.58)",
  },
  heroPhotoBody: {
    position: "absolute",
    left: 112,
    top: 220,
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 1,
  },
  heroOverlay: {
    backgroundColor: "rgba(8,8,11,0.48)",
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
  },
  heroOnline: {
    color: "#82F7A6",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 10,
  },
  heroNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  heroName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.1,
    fontFamily: "SpaceGrotesk_700Bold",
    marginRight: 12,
  },
  heroAge: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 30,
    lineHeight: 32,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  heroMeta: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  heroActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 22,
  },
  roundActionGhost: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionGhostLabel: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  roundActionPrimary: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F26A8D",
    borderWidth: 1,
    borderColor: "rgba(255,123,89,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionPrimaryLabel: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailCard: {
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailPhoto: {
    height: 478,
    overflow: "hidden",
  },
  detailPhotoOrbLarge: {
    position: "absolute",
    top: 152,
    left: 30,
    width: 236,
    height: 236,
    borderRadius: 118,
    backgroundColor: "rgba(246,187,170,0.44)",
  },
  detailPhotoAccentShape: {
    position: "absolute",
    right: 26,
    top: 162,
    width: 112,
    height: 300,
    borderRadius: 52,
  },
  detailOverlay: {
    backgroundColor: "rgba(8,8,11,0.48)",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
  },
  detailOnline: {
    color: "#82F7A6",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 10,
  },
  detailNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  detailName: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 38,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.1,
    marginRight: 12,
  },
  detailAge: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 30,
    lineHeight: 32,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  detailMeta: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 16,
  },
  detailChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  detailInterestChip: {
    height: 32,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  detailInterestChipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  detailBioLabel: {
    color: "rgba(255,248,251,0.56)",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  detailBioText: {
    color: "rgba(255,248,251,0.78)",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  searchCard: {
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchPlaceholder: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  searchAccent: {
    color: "#82F7A6",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  communityChipRow: {
    flexDirection: "row",
    gap: 10,
  },
  communityStoryCard: {
    borderRadius: 26,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  communityStoryTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 18,
  },
  communityStoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  communityStoryPill: {
    alignItems: "center",
  },
  communityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginBottom: 8,
  },
  communityAvatarLabel: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  communityFeatureCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  communityFeatureVisual: {
    height: 210,
    overflow: "hidden",
  },
  communityFeatureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,8,11,0.16)",
  },
  communityHeartButton: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  communityHeartGlyph: {
    color: "#82F7A6",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  communityFeatureName: {
    color: "#FFFFFF",
    fontSize: 22,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    paddingHorizontal: 18,
    paddingTop: 14,
    marginBottom: 8,
  },
  communityFeatureMeta: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_500Medium",
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  mapCard: {
    height: 166,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    justifyContent: "center",
  },
  mapLineOne: {
    position: "absolute",
    top: 42,
    left: 48,
    width: 180,
    height: 2,
    backgroundColor: "rgba(169,217,255,0.48)",
    transform: [{ rotate: "-12deg" }],
  },
  mapLineTwo: {
    position: "absolute",
    top: 78,
    left: 104,
    width: 170,
    height: 2,
    backgroundColor: "rgba(169,217,255,0.48)",
    transform: [{ rotate: "14deg" }],
  },
  mapMarkerOne: {
    position: "absolute",
    top: 54,
    left: 92,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#82F7A6",
  },
  mapMarkerTwo: {
    position: "absolute",
    top: 92,
    right: 92,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#F26A8D",
  },
  mapPlaceholder: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
  },
  nearbyCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  nearbyMiniCardWrap: {
    flex: 1,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  nearbyMiniCard: {
    height: 168,
  },
  nearbyMiniName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    paddingHorizontal: 14,
    paddingTop: 12,
    marginBottom: 4,
  },
  nearbyMiniDistance: {
    color: "rgba(255,255,255,0.80)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  contextCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  contextCardTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 10,
  },
  contextCardBody: {
    color: "rgba(255,255,255,0.74)",
    fontSize: 14,
    lineHeight: 21,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  bottomNav: {
    position: "absolute",
    left: 22,
    right: 22,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  bottomNavItem: {
    width: 48,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavGlow: {
    position: "absolute",
    width: 40,
    height: 34,
    borderRadius: 20,
    backgroundColor: "rgba(242,106,141,0.18)",
  },
  bottomNavIcon: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  bottomNavIconActive: {
    color: "#82F7A6",
  },
  hiddenSignOutHit: {
    position: "absolute",
    top: 18,
    left: 22,
    opacity: 0.01,
  },
  hiddenSignOutText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});
