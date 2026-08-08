import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { getMatches, type MatchResult } from "../lib/matching";
import {
  createSwipe,
  getNextMatch,
  getMutualMatches,
  type MutualMatch,
  type SwipeAction,
} from "../lib/swipe";
import type { TokenResponse } from "../types/auth";

type DiscoverScreenProps = {
  session: TokenResponse;
  isDetailMode: boolean;
  selectedMatch: MatchResult | null;
  onOpenDetail: (match: MatchResult) => void;
  onOpenChat: (matchedUserId: string, name: string) => void;
  onCloseDetail: () => void;
  onSignOut: () => void;
};

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
  ];
}

function useMatchTone(index: number) {
  return FEED_TONES[index % FEED_TONES.length];
}

export function DiscoverScreen({
  session,
  isDetailMode,
  selectedMatch,
  onOpenDetail,
  onOpenChat,
  onCloseDetail,
}: DiscoverScreenProps) {
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [matchNotice, setMatchNotice] = useState("");
  const [matchModalProfile, setMatchModalProfile] = useState<MatchResult | null>(null);
  const [swipeCandidate, setSwipeCandidate] = useState<MatchResult | null>(null);
  const [swipeLoading, setSwipeLoading] = useState(false);
  
  const swipeTranslate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const matchModalScale = useRef(new Animated.Value(0.7)).current;
  const matchModalOpacity = useRef(new Animated.Value(0)).current;

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

        const [matchesResult, nextResult] = await Promise.allSettled([
          getMatches(session.user.id),
          getNextMatch(session.user.id, session.access_token),
        ]);

        if (isCancelled) return;

        if (matchesResult.status === "fulfilled") {
          setMatches(matchesResult.value);
        } else {
          setMatches([]);
          setError(
            matchesResult.reason instanceof Error
              ? matchesResult.reason.message
              : "Could not load discover right now."
          );
        }

        if (nextResult.status === "fulfilled") {
          setSwipeCandidate(nextResult.value);
        } else {
          setSwipeCandidate(null);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadDiscoverData();

    return () => {
      isCancelled = true;
    };
  }, [session.access_token, session.user.id]);

  useEffect(() => {
    if (matchModalProfile) {
      matchModalScale.setValue(0.75);
      matchModalOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(matchModalScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(matchModalOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [matchModalProfile, matchModalScale, matchModalOpacity]);

  const closeMatchModal = (onComplete?: () => void) => {
    Animated.parallel([
      Animated.timing(matchModalScale, {
        toValue: 0.82,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(matchModalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMatchModalProfile(null);
      setMatchNotice("");
      onComplete?.();
    });
  };

  const displayMatches = matches.length > 0 ? matches : fallbackMatches;

  const submitSwipeAction = async (
    action: SwipeAction,
    profileToSwipe: MatchResult
  ) => {
    if (swipeLoading) return;
    setSwipeLoading(true);

    try {
      await createSwipe(
        profileToSwipe.userId,
        action,
        session.access_token
      );
      
      const [nextOne, refreshedMutualMatches] = await Promise.all([
        getNextMatch(session.user.id, session.access_token),
        getMutualMatches(session.user.id, session.access_token).catch(() => []),
      ]);

      if (
        action === "like" &&
        refreshedMutualMatches.some((match) => match.userId === profileToSwipe.userId)
      ) {
        setMatchNotice(`It's a match with ${profileToSwipe.name}.`);
        setMatchModalProfile(profileToSwipe);
      }
      
      setSwipeCandidate(nextOne);
    } catch (err) {
      // Failed swipe
    } finally {
      setSwipeLoading(false);
    }
  };

  const triggerSwipeAnimation = (
    action: SwipeAction,
    direction: "left" | "right" | "up"
  ) => {
    if (!swipeCandidate || swipeLoading) {
      return;
    }

    setSwipeLoading(true);

    const { width, height } = Dimensions.get("window");
    const target =
      direction === "left"
        ? { x: -width * 1.5, y: 20 }
        : direction === "up"
          ? { x: 0, y: -height * 0.8 }
          : { x: width * 1.5, y: 20 };

    Animated.timing(swipeTranslate, {
      toValue: target,
      duration: 220,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) {
        setSwipeLoading(false);
        return;
      }

      submitSwipeAction(action, swipeCandidate).then(() => {
        swipeTranslate.setValue({ x: 0, y: 0 });
      });
    });
  };

  const handleQuickSwipe = (action: SwipeAction) => {
    triggerSwipeAnimation(action, action === "like" ? "right" : "left");
  };

  const swipePanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        !swipeLoading &&
        !!swipeCandidate &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 8,
      onPanResponderMove: Animated.event(
        [null, { dx: swipeTranslate.x, dy: swipeTranslate.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (!swipeCandidate) {
          Animated.spring(swipeTranslate, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
          return;
        }

        if (gestureState.dx > 120) {
          triggerSwipeAnimation("like", "right");
        } else if (gestureState.dx < -120) {
          triggerSwipeAnimation("pass", "left");
        } else {
          Animated.spring(swipeTranslate, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const renderMatchModal = () => {
    if (!matchModalProfile) return null;
    const tone = FEED_TONES[0];

    return (
      <Animated.View
        style={[styles.matchModalOverlay, { opacity: matchModalOpacity }]}
      >
        <LinearGradient
          colors={["rgba(9,7,13,0.85)", "rgba(9,7,13,0.98)"]}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.matchModalCardWrap,
            { transform: [{ scale: matchModalScale }] },
          ]}
        >
          <LinearGradient
            colors={[tone.start, tone.end]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchModalCard}
          >
            <View style={styles.matchModalGlow} />
            <Text style={styles.matchModalTitle}>It's a Vibe</Text>
            <Text style={styles.matchModalSubtitle}>
              You and {matchModalProfile.name.split(" ")[0]} both love{" "}
              {matchModalProfile.sharedArtists[0] || "similar music"}.
            </Text>

            {matchNotice ? (
              <View style={styles.matchNoticeWrap}>
                <Text style={styles.matchNoticeText}>{matchNotice}</Text>
              </View>
            ) : null}

            <View style={styles.matchModalActions}>
              <Pressable
                style={styles.matchModalPrimaryButton}
                onPress={() => {
                  closeMatchModal(() => {
                    onOpenChat(matchModalProfile.userId, matchModalProfile.name);
                  });
                }}
              >
                <Text style={styles.matchModalPrimaryText}>Message them</Text>
              </Pressable>
              <Pressable
                style={styles.matchModalSecondaryButton}
                onPress={() => closeMatchModal()}
              >
                <Text style={styles.matchModalSecondaryText}>Keep Swiping</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderDetailMode = () => {
    const detailMatch = selectedMatch ?? swipeCandidate ?? displayMatches[0] ?? null;

    if (!detailMatch) {
      return (
        <View style={styles.detailEmptyState}>
          <Text style={styles.detailEmptyTitle}>No profile selected</Text>
          <Text style={styles.detailEmptyBody}>
            Open a card first, or keep swiping until a profile is ready.
          </Text>
        </View>
      );
    }

    const details = [
      { label: "Location", value: "New York, NY" },
      { label: "Astrology", value: "Scorpio Sun" },
      { label: "Height", value: "5'9\"" },
      { label: "Looking for", value: "Short-term fun" },
    ];

    const habits = [
      { label: "Drinking", value: "Socially" },
      { label: "Smoking", value: "Never" },
      { label: "Weed", value: "Sometimes" },
    ];

    return (
      <View style={styles.detailView}>
        <View style={styles.detailHeroBox}>
          <LinearGradient
            colors={["#FF7B59", "#F26A8D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.detailHeroGradient}
          />
          <Pressable style={styles.detailCloseButton} onPress={onCloseDetail}>
            <Text style={styles.detailCloseText}>✕</Text>
          </Pressable>
          <View style={styles.detailHeroContent}>
            <Text style={styles.detailHeroName}>{detailMatch.name}</Text>
            <Text style={styles.detailHeroMeta}>
              {Math.round(detailMatch.similarity * 100)}% Match
            </Text>
          </View>
        </View>

        <View style={styles.detailSectionBody}>
          <View style={styles.detailBioCard}>
            <Text style={styles.detailSectionTitle}>About</Text>
            <Text style={styles.detailBioText}>
              {detailMatch.matchReason}
            </Text>
            <View style={styles.detailGridRow}>
              {details.map((d) => (
                <View key={d.label} style={styles.detailGridItem}>
                  <Text style={styles.detailGridLabel}>{d.label}</Text>
                  <Text style={styles.detailGridValue}>{d.value}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.detailHabitsCard}>
            <Text style={styles.detailSectionTitle}>Habits</Text>
            <View style={styles.detailHabitsRow}>
              {habits.map((h) => (
                <View key={h.label} style={styles.detailHabitPill}>
                  <Text style={styles.detailHabitPillLabel}>{h.label}</Text>
                  <Text style={styles.detailHabitPillText}>{h.value}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isDetailMode) {
    return (
      <View style={{ flex: 1 }}>
        {renderDetailMode()}
        {renderMatchModal()}
      </View>
    );
  }

  return (
    <View style={styles.sectionBody}>
      <View style={styles.heroDeck}>
        {swipeCandidate ? (
          <Animated.View
            {...swipePanResponder.panHandlers}
            style={[
              styles.heroCardTopWrap,
              {
                transform: [
                  { translateX: swipeTranslate.x },
                  { translateY: swipeTranslate.y },
                  {
                    rotate: swipeTranslate.x.interpolate({
                      inputRange: [-200, 0, 200],
                      outputRange: ["-10deg", "0deg", "10deg"],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.heroCard, { backgroundColor: "#0F0F0F" }]}>
              <LinearGradient
                colors={["#FFD166", "#FF7B59"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.85)"]}
                style={styles.heroOverlay}
              >
                <View style={styles.heroCardHeader}>
                  <Text style={styles.heroOnline}>Online now</Text>
                  <View style={styles.heroCompatibilityBadge}>
                    <Text style={styles.heroCompatibilityText}>
                      {Math.round(swipeCandidate.similarity * 100)}% match
                    </Text>
                  </View>
                </View>
                <View style={styles.heroNameRow}>
                  <Text style={styles.heroName}>{swipeCandidate.name}</Text>
                  <Pressable
                    style={styles.heroDetailIcon}
                    onPress={() => onOpenDetail(swipeCandidate)}
                  >
                    <Text style={styles.heroDetailIconText}>i</Text>
                  </Pressable>
                </View>
                <Text style={styles.heroMeta}>
                  {swipeCandidate.artistCount} shared artists
                </Text>
                {swipeCandidate.sharedArtists.length > 0 ? (
                  <View style={styles.heroSharedTaste}>
                    <Text style={styles.heroSharedTasteLabel}>Both into</Text>
                    <View style={styles.heroSharedTasteChips}>
                      {swipeCandidate.sharedArtists.slice(0, 3).map((artist) => {
                        const firstName = artist.split(" ")[0] || artist;
                        return (
                          <View key={artist} style={styles.heroSharedTasteChip}>
                            <Text style={styles.heroSharedTasteChipText}>
                              {firstName}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </LinearGradient>
            </View>
          </Animated.View>
        ) : loading || swipeLoading ? (
          <View style={[styles.heroCard, styles.heroCardEmpty]}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.heroEmptyText}>Loading your next match...</Text>
          </View>
        ) : (
          <View style={[styles.heroCard, styles.heroCardEmpty]}>
            <Text style={styles.heroEmptyTitle}>Out of matches</Text>
            <Text style={styles.heroEmptyText}>
              Check back later for more people with your taste.
            </Text>
          </View>
        )}
      </View>

      {swipeCandidate ? (
        <View style={styles.heroActionRow}>
          <Pressable
            style={[styles.heroActionButton, styles.heroActionButtonPass]}
            onPress={() => handleQuickSwipe("pass")}
            disabled={swipeLoading}
          >
            <Text style={styles.heroActionButtonText}>Pass</Text>
          </Pressable>
          <Pressable
            style={[styles.heroActionButton, styles.heroActionButtonLike]}
            onPress={() => handleQuickSwipe("like")}
            disabled={swipeLoading}
          >
            <Text style={styles.heroActionButtonText}>Like</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Recently Played</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.feedScroll}
        contentContainerStyle={styles.feedScrollContent}
      >
        {displayMatches.map((match, index) => {
          const tone = useMatchTone(index);
          return (
            <Pressable
              key={match.userId}
              style={styles.feedCard}
              onPress={() => onOpenDetail(match)}
            >
              <LinearGradient
                colors={[tone.start, tone.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[styles.feedCardOrb, { backgroundColor: tone.orb }]}
              />
              <View style={styles.feedCardContent}>
                <View>
                  <Text style={[styles.feedCardName, { color: tone.accent }]}>
                    {match.name.split(" ")[0]}
                  </Text>
                  <Text style={styles.feedCardScore}>
                    {Math.round(match.similarity * 100)}% match
                  </Text>
                </View>
                <Text style={styles.feedCardSnippet} numberOfLines={2}>
                  {match.matchReason}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {renderMatchModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 16,
    marginLeft: 8,
  },
  heroDeck: {
    position: "relative",
    minHeight: 456,
    justifyContent: "flex-start",
  },
  heroActionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: -6,
    marginBottom: 18,
  },
  heroActionButton: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  heroActionButtonPass: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.08)",
  },
  heroActionButtonLike: {
    backgroundColor: "rgba(130,247,166,0.14)",
    borderColor: "rgba(130,247,166,0.25)",
  },
  heroActionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroCardTopWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  heroCard: {
    height: 420,
    borderRadius: 30,
    overflow: "hidden",
    justifyContent: "flex-end",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroCardEmpty: {
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  heroEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  heroEmptyText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
    marginTop: 12,
  },
  heroOverlay: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 16,
    justifyContent: "flex-end",
  },
  heroCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  heroOnline: {
    color: "#82F7A6",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  heroCompatibilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(130,247,166,0.18)",
    borderWidth: 1,
    borderColor: "rgba(130,247,166,0.3)",
  },
  heroCompatibilityText: {
    color: "#82F7A6",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "SpaceGrotesk_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroDetailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroDetailIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_500Medium",
    marginTop: 2,
  },
  heroSharedTaste: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  heroSharedTasteLabel: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 10,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  heroSharedTasteChips: {
    flexDirection: "row",
    gap: 6,
  },
  heroSharedTasteChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  heroSharedTasteChipText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  feedScroll: {
    marginHorizontal: -16,
    marginBottom: 32,
  },
  feedScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  feedCard: {
    width: 260,
    height: 300,
    borderRadius: 24,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  feedCardOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    transform: [{ scaleY: 0.8 }],
  },
  feedCardContent: {
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.25)",
    gap: 12,
  },
  feedCardName: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  feedCardScore: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
    opacity: 0.8,
  },
  feedCardSnippet: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
    fontFamily: "SpaceGrotesk_400Regular",
    opacity: 0.9,
  },
  matchModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  matchModalCardWrap: {
    width: "85%",
    maxWidth: 340,
  },
  matchModalCard: {
    borderRadius: 36,
    padding: 32,
    alignItems: "center",
    overflow: "hidden",
  },
  matchModalGlow: {
    position: "absolute",
    top: -60,
    left: -60,
    right: -60,
    height: 200,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 200,
    transform: [{ scaleY: 0.5 }],
  },
  matchModalTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 12,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  matchModalSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
    marginBottom: 32,
  },
  matchNoticeWrap: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 24,
    width: "100%",
  },
  matchNoticeText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
  },
  matchModalActions: {
    width: "100%",
    gap: 12,
  },
  matchModalPrimaryButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
  },
  matchModalPrimaryText: {
    color: "#000000",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  matchModalSecondaryButton: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  matchModalSecondaryText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailView: {
    flex: 1,
  },
  detailEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  detailEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    lineHeight: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  detailEmptyBody: {
    color: "rgba(255,255,255,0.64)",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_400Regular",
    textAlign: "center",
  },
  detailHeroBox: {
    height: 380,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  detailHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  detailCloseButton: {
    position: "absolute",
    top: 64,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  detailCloseText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailHeroContent: {
    gap: 4,
  },
  detailHeroName: {
    color: "#FFFFFF",
    fontSize: 42,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailHeroMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  detailSectionBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  detailBioCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  detailSectionTitle: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
  },
  detailBioText: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_400Regular",
    marginBottom: 24,
  },
  detailGridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  detailGridItem: {
    width: "45%",
    gap: 4,
  },
  detailGridLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  detailGridValue: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  detailHabitsCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 24,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 40,
  },
  detailHabitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  detailHabitPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(130,247,166,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(130,247,166,0.2)",
    gap: 8,
  },
  detailHabitPillLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "uppercase",
  },
  detailHabitPillText: {
    color: "#82F7A6",
    fontSize: 11,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
