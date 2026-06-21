import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
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
import {
  createSwipe,
  type MutualMatch,
  getMutualMatches,
  getNextMatch,
  type SwipeAction,
} from "../lib/swipe";
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

function useMatchTone(index: number) {
  return FEED_TONES[index % FEED_TONES.length];
}

export function DiscoverScreen({ session, onSignOut }: DiscoverScreenProps) {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width - 32, 430);
  const statusBarHeight = NativeStatusBar.currentHeight ?? 0;
  const topInset =
    Platform.OS === "android" ? statusBarHeight + 18 : 18;
  const androidBottomInset = useMemo(() => {
    if (Platform.OS !== "android") {
      return 0;
    }

    const screenHeight = Dimensions.get("screen").height;
    const rawInset = screenHeight - height - statusBarHeight;

    return Math.max(rawInset, 0);
  }, [height, statusBarHeight]);
  const safeBottom = Platform.OS === "ios" ? 26 : Math.max(androidBottomInset + 8, 18);
  const bottomNavHeight = 62;
  const bottomNavOffset = safeBottom + 4;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [activeTab, setActiveTab] = useState<DiscoverTab>("matches");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchNotice, setMatchNotice] = useState("");
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [swipeCandidate, setSwipeCandidate] = useState<MatchResult | null>(null);
  const [swipeLoading, setSwipeLoading] = useState(false);
  const tabMotion = useRef(new Animated.Value(1)).current;

  const fallbackMatches = useMemo(
    () => buildFallbackMatches(session.user.name),
    [session.user.name]
  );

  useEffect(() => {
    let isCancelled = false;

    const loadDiscoverData = async () => {
      try {
        setLoading(true);
        setError("");

        const [matchesResult, nextResult, mutualResult] = await Promise.allSettled([
          getMatches(session.user.id),
          getNextMatch(session.user.id, session.access_token),
          getMutualMatches(session.user.id, session.access_token),
        ]);

        if (isCancelled) {
          return;
        }

        if (matchesResult.status === "fulfilled") {
          setMatches(matchesResult.value);
        } else {
          setMatches([]);
          const message =
            matchesResult.reason instanceof Error
              ? matchesResult.reason.message
              : "Could not load discover right now.";
          setError(message);
        }

        if (nextResult.status === "fulfilled") {
          setSwipeCandidate(nextResult.value);
        } else {
          setSwipeCandidate(null);
        }

        if (mutualResult.status === "fulfilled") {
          setMutualMatches(mutualResult.value);
        } else {
          setMutualMatches([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadDiscoverData();

    return () => {
      isCancelled = true;
    };
  }, [session.access_token, session.user.id]);

  const displayMatches = useMemo(() => {
    const liveMatches = matches.length > 0 ? matches : [];

    if (swipeCandidate) {
      return [
        swipeCandidate,
        ...liveMatches.filter((match) => match.userId !== swipeCandidate.userId),
      ];
    }

    if (liveMatches.length > 0) {
      return liveMatches;
    }

    return fallbackMatches;
  }, [fallbackMatches, matches, swipeCandidate]);

  const usingPreviewData = matches.length === 0 && !swipeCandidate;

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

  const isDetailMode = activeTab === "detail";
  const heroMatch = swipeCandidate ?? (usingPreviewData ? displayMatches[0] ?? null : null);
  const communityFeature = displayMatches[1] ?? heroMatch;
  const nearbyCards = displayMatches.slice(0, 2);
  const mutualMatchCount = mutualMatches.length;

  const getMatchFromMutual = (mutual: MutualMatch): MatchResult => {
    const existing =
      displayMatches.find((match) => match.userId === mutual.userId) ??
      matches.find((match) => match.userId === mutual.userId);

    if (existing) {
      return existing;
    }

    return {
      userId: mutual.userId,
      name: mutual.name,
      bio: mutual.bio,
      locationCity: mutual.locationCity,
      similarity: 0.82,
      artistCount: 0,
      trackCount: 0,
      sharedArtists: [],
      sharedTracks: [],
      matchReason: "You both liked each other and unlocked a new match.",
    };
  };

  const handleOpenDetail = (match: MatchResult) => {
    setSelectedMatchId(match.userId);
    setActiveTab("detail");
  };

  const handleSwipeAction = async (action: SwipeAction) => {
    if (!heroMatch || usingPreviewData || swipeLoading) {
      return;
    }

    setSwipeLoading(true);
    setError("");
    setMatchNotice("");

    try {
      await createSwipe(
        heroMatch.userId,
        action,
        session.access_token
      );

      if (action === "like") {
        setMatchNotice("");
      }

      const [nextCandidate, refreshedMatches, refreshedMutualMatches] = await Promise.all([
        getNextMatch(session.user.id, session.access_token),
        getMatches(session.user.id).catch(() => matches),
        getMutualMatches(session.user.id, session.access_token).catch(
          () => mutualMatches
        ),
      ]);

      setSwipeCandidate(nextCandidate);
      setMatches(refreshedMatches);
      setMutualMatches(refreshedMutualMatches);
      setSelectedMatchId(nextCandidate?.userId ?? refreshedMatches[0]?.userId ?? null);

      if (
        action === "like" &&
        refreshedMutualMatches.some((match) => match.userId === heroMatch.userId)
      ) {
        setMatchNotice(`It's a match with ${heroMatch.name}.`);
      }

      if (activeTab === "detail") {
        setActiveTab("matches");
      }
    } catch (swipeError) {
      setError(
        swipeError instanceof Error
          ? swipeError.message
          : "Could not save your swipe right now."
      );
    } finally {
      setSwipeLoading(false);
    }
  };

  const renderInfoBanner = () => {
    if (!usingPreviewData && !error && !matchNotice) {
      return null;
    }

    return (
      <View style={styles.infoBanner}>
        <Text style={styles.infoBannerText}>
          {matchNotice
            ? matchNotice
            : error
            ? error
            : "Live matches are still light, so this screen is using preview concept data for now."}
        </Text>
      </View>
    );
  };

  const renderTopSection = () => {
    if (activeTab === "matches") {
      return (
        <View style={styles.topSection}>
          <Text style={styles.heroTitle}>Matches</Text>

          <View style={styles.topActionRow}>
            <Pressable style={styles.topIconButton}>
              <Text style={styles.topIconGlyph}>o</Text>
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
        <View
          style={[
            styles.topSection,
            styles.detailTopSection,
            { paddingTop: topInset - 4 },
          ]}
        >
          <View style={styles.detailTopRow}>
            <Pressable
              style={styles.detailTopIconButton}
              onPress={() => setActiveTab("matches")}
            >
              <Text style={styles.topIconGlyph}>{"<"}</Text>
            </Pressable>

            <View style={styles.detailProgressTrack}>
              <View style={styles.detailProgressFill} />
            </View>

            <Pressable style={styles.detailTopIconButton}>
              <Text style={styles.topIconGlyph}>o</Text>
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
          <Text style={styles.heroTitleSmaller}>Your matches</Text>
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
          <Text style={styles.emptyStateTitle}>No more profiles right now</Text>
          <Text style={styles.emptyStateBody}>
            You have moved through the current stack. As more compatible users show up, the next profile will appear here.
          </Text>
        </View>
      );
    }

    const tone = useMatchTone(0);

    return (
      <View style={styles.sectionBody}>
        <View style={styles.filterRow}>
          <Pressable style={styles.filterIconButton}>
            <Text style={styles.filterIconGlyph}>=</Text>
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

        <View style={styles.feedStageCard}>
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
                <Text style={styles.heroOnline}>Online</Text>
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
            <Pressable
              style={[
                styles.roundActionGhost,
                swipeLoading && styles.actionDisabled,
              ]}
              onPress={() => handleSwipeAction("pass")}
              disabled={swipeLoading || usingPreviewData}
            >
              <Text style={styles.roundActionGhostLabel}>X</Text>
            </Pressable>
            <Pressable
              style={[
                styles.roundActionPrimary,
                swipeLoading && styles.actionDisabled,
              ]}
              onPress={() => handleSwipeAction("like")}
              disabled={swipeLoading || usingPreviewData}
            >
              <Text style={styles.roundActionPrimaryLabel}>
                {swipeLoading ? "..." : "Love"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.roundActionGhost,
                swipeLoading && styles.actionDisabled,
              ]}
              onPress={() => handleSwipeAction("super_like")}
              disabled={swipeLoading || usingPreviewData}
            >
              <Text style={styles.roundActionGhostLabel}>Boost</Text>
            </Pressable>
          </View>
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
        <View
          style={[
            styles.detailCard,
            {
              minHeight: height - topInset + safeBottom + 24,
            },
          ]}
        >
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
            <View style={styles.detailPhotoSubjectGlow} />
            <LinearGradient
              colors={[
                "rgba(8,8,11,0.00)",
                "rgba(8,8,11,0.08)",
                "rgba(8,8,11,0.36)",
                "rgba(8,8,11,0.78)",
                "rgba(8,8,11,0.94)",
              ]}
              locations={[0, 0.3, 0.58, 0.82, 1]}
              style={styles.detailImageShade}
            />

            <View style={styles.detailOverlay}>
              <View style={styles.detailOverlayTop}>
                <View style={styles.detailIdentityLead}>
                  <Text style={styles.detailOnline}>Online</Text>
                </View>
              </View>

              <View style={styles.detailOverlayBottom}>
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
                <Text style={styles.detailBioText}>
                  {selectedMatch.matchReason}
                </Text>

                <View style={styles.detailPromptBlock}>
                  <Text style={styles.detailPromptLabel}>Prompt</Text>
                  <Text style={styles.detailPromptText}>
                    A perfect first date for me starts with music, something spontaneous,
                    and a place where the conversation can actually breathe.
                  </Text>
                </View>

                <View style={styles.detailPromptBlock}>
                  <Text style={styles.detailPromptLabel}>More vibe</Text>
                  <Text style={styles.detailPromptText}>
                    Usually into night drives, films with atmosphere, and people who
                    feel easy to talk to after one song.
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      </View>
    );
  };

  const renderCommunityTab = () => {
    if (mutualMatchCount > 0) {
      return (
        <View style={styles.sectionBody}>
          <View style={styles.matchCountCard}>
            <Text style={styles.matchCountTitle}>Mutual likes</Text>
            <Text style={styles.matchCountBody}>
              {mutualMatchCount} {mutualMatchCount === 1 ? "person wants to keep the vibe going." : "people want to keep the vibe going."}
            </Text>
          </View>

          {mutualMatches.map((mutualMatch) => (
            <Pressable
              key={mutualMatch.userId}
              style={styles.mutualMatchCard}
              onPress={() => handleOpenDetail(getMatchFromMutual(mutualMatch))}
            >
              <View style={styles.mutualMatchAvatar}>
                <Text style={styles.mutualMatchAvatarText}>
                  {mutualMatch.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.mutualMatchContent}>
                <Text style={styles.mutualMatchName}>{mutualMatch.name}</Text>
                <Text style={styles.mutualMatchMeta}>
                  {mutualMatch.locationCity || "Location coming in soon"}
                </Text>
                <Text style={styles.mutualMatchBio} numberOfLines={2}>
                  {mutualMatch.bio || "You both matched through shared music taste and energy."}
                </Text>
              </View>
              <View style={styles.mutualMatchBadge}>
                <Text style={styles.mutualMatchBadgeText}>Match</Text>
              </View>
            </Pressable>
          ))}
        </View>
      );
    }

    return (
      <View style={styles.sectionBody}>
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyStateTitle}>No mutual matches yet</Text>
          <Text style={styles.emptyStateBody}>
            Keep swiping through the feed. When someone likes you back, they will show up here as a real match.
          </Text>
        </View>

        <View style={styles.feedStageCard}>
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
                  <Text style={styles.communityHeartGlyph}>Love</Text>
                </Pressable>
              </LinearGradient>
              <Text style={styles.communityFeatureName}>{communityFeature.name}</Text>
              <Text style={styles.communityFeatureMeta}>
                {communityFeature.sharedArtists.slice(0, 3).join(" / ")}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderNearbyTab = () => {
    return (
      <View style={styles.sectionBody}>
        <View style={styles.feedStageCard}>
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
    { key: "matches", icon: "Feed" },
    { key: "detail", icon: "View" },
    { key: "community", icon: "Club" },
    { key: "nearby", icon: "Near" },
  ];

  const pagePaddingTop = isDetailMode ? 0 : 96;
  const pagePaddingBottom = isDetailMode ? safeBottom + 28 : bottomNavHeight + bottomNavOffset + 22;
  const contentMinHeight = Math.max(
    height - topInset - pagePaddingTop - pagePaddingBottom,
    520
  );

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.phoneShell,
          isDetailMode ? styles.phoneShellImmersive : null,
          {
            width: isDetailMode ? width : contentWidth,
            marginTop: isDetailMode ? 0 : topInset,
          },
        ]}
      >
        {renderTopSection()}

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={isDetailMode}
          contentContainerStyle={[
            isDetailMode ? styles.scrollContentDetail : styles.scrollContent,
            {
              paddingTop: isDetailMode ? 0 : pagePaddingTop,
              paddingBottom: pagePaddingBottom,
              minHeight: isDetailMode
                ? height + pagePaddingBottom
                : contentMinHeight + pagePaddingTop + pagePaddingBottom,
            },
          ]}
        >
          <View style={styles.innerContent}>
            {!isDetailMode ? renderInfoBanner() : null}
            <Animated.View
              key={isDetailMode ? `detail-${selectedMatchId ?? "none"}` : activeTab}
              style={tabAnimatedStyle}
            >
              {renderContent()}
            </Animated.View>
          </View>
        </ScrollView>

        {!isDetailMode ? (
          <View
            style={[
              styles.bottomNav,
              {
                bottom: bottomNavOffset,
                height: bottomNavHeight,
              },
            ]}
          >
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
        ) : null}

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
    backgroundColor: "transparent",
  },
  phoneShellImmersive: {
    maxWidth: "100%",
    borderRadius: 0,
  },
  topSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 22,
    paddingTop: 18,
    backgroundColor: "transparent",
  },
  detailTopSection: {
    backgroundColor: "transparent",
    paddingHorizontal: 12,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 42,
    letterSpacing: -1.3,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroTitleSmaller: {
    color: "#FFFFFF",
    fontSize: 38,
    lineHeight: 38,
    letterSpacing: -1.1,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  topActionRow: {
    position: "absolute",
    right: 22,
    top: 16,
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
  detailTopIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.12)",
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
    marginHorizontal: 14,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  detailProgressFill: {
    width: "24%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#DFFF00",
  },
  scrollContent: {
    paddingHorizontal: 22,
  },
  scrollContentDetail: {
    paddingHorizontal: 0,
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
    gap: 18,
  },
  feedStageCard: {
    borderRadius: 32,
    padding: 16,
    backgroundColor: "rgba(10,8,12,0.26)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 16,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 28,
    elevation: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
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
    flex: 1,
    gap: 10,
  },
  filterChip: {
    flex: 1,
    minWidth: 0,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
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
    marginTop: 2,
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
    gap: 18,
  },
  roundActionGhost: {
    minWidth: 58,
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionGhostLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  roundActionPrimary: {
    minWidth: 74,
    height: 56,
    borderRadius: 28,
    paddingHorizontal: 18,
    backgroundColor: "#F26A8D",
    borderWidth: 1,
    borderColor: "rgba(255,123,89,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  roundActionPrimaryLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  actionDisabled: {
    opacity: 0.55,
  },
  matchCountCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  matchCountTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  matchCountBody: {
    color: "rgba(255,248,251,0.76)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  detailCard: {
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
    marginHorizontal: 0,
  },
  detailPhoto: {
    flex: 1,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  detailPhotoOrbLarge: {
    position: "absolute",
    top: 116,
    left: -22,
    width: 212,
    height: 212,
    borderRadius: 106,
    backgroundColor: "rgba(255, 102, 156, 0.24)",
  },
  detailPhotoAccentShape: {
    position: "absolute",
    right: -22,
    top: 96,
    width: 168,
    height: 338,
    borderRadius: 74,
  },
  detailPhotoSubjectGlow: {
    position: "absolute",
    top: 128,
    left: 48,
    width: 278,
    height: 386,
    borderRadius: 140,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  detailImageShade: {
    ...StyleSheet.absoluteFillObject,
  },
  detailOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 86,
    paddingBottom: 42,
    justifyContent: "space-between",
  },
  detailOverlayTop: {
    alignItems: "flex-start",
  },
  detailIdentityLead: {
    paddingTop: 178,
  },
  detailOverlayBottom: {
    paddingTop: 12,
  },
  detailOnline: {
    color: "#E9FF48",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 10,
    textShadowColor: "rgba(8,8,11,0.42)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  detailName: {
    flex: 1,
    color: "#E9FF1A",
    fontSize: 54,
    lineHeight: 52,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -2.1,
    marginRight: 10,
    textShadowColor: "rgba(8,8,11,0.38)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailAge: {
    color: "rgba(233,255,26,0.28)",
    fontSize: 44,
    lineHeight: 44,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: -1.2,
    paddingTop: 8,
  },
  detailMeta: {
    color: "#F4EFDA",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 14,
    textShadowColor: "rgba(8,8,11,0.34)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  detailInterestChip: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  detailInterestChipText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  detailBioLabel: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 6,
  },
  detailBioText: {
    color: "rgba(255,248,251,0.92)",
    fontSize: 14,
    lineHeight: 19,
    fontFamily: "SpaceGrotesk_400Regular",
    maxWidth: "90%",
    textShadowColor: "rgba(8,8,11,0.36)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  detailPromptBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    maxWidth: "92%",
  },
  detailPromptLabel: {
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  detailPromptText: {
    color: "rgba(255,248,251,0.92)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
    textShadowColor: "rgba(8,8,11,0.36)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
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
  mutualMatchCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mutualMatchAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(242,106,141,0.24)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  mutualMatchAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  mutualMatchContent: {
    flex: 1,
    paddingRight: 10,
  },
  mutualMatchName: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 4,
  },
  mutualMatchMeta: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
    marginBottom: 6,
  },
  mutualMatchBio: {
    color: "rgba(255,248,251,0.74)",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  mutualMatchBadge: {
    minWidth: 62,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    backgroundColor: "rgba(130,247,166,0.16)",
    borderWidth: 1,
    borderColor: "rgba(130,247,166,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  mutualMatchBadgeText: {
    color: "#82F7A6",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_700Bold",
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
    minWidth: 50,
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  communityHeartGlyph: {
    color: "#82F7A6",
    fontSize: 12,
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
    left: 0,
    right: 0,
    backgroundColor: "rgba(10,8,12,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  bottomNavItem: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavGlow: {
    position: "absolute",
    width: 72,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(242,106,141,0.16)",
  },
  bottomNavIcon: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 12,
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
