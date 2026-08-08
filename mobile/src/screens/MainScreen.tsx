import { useMemo, useRef, useState } from "react";
import {
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
import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_500Medium, SpaceGrotesk_700Bold } from "@expo-google-fonts/space-grotesk";

import type { TokenResponse } from "../types/auth";
import { DiscoverScreen } from "./DiscoverScreen";
import { InboxScreen } from "./InboxScreen";
import { ChatThreadScreen } from "./ChatThreadScreen";
import { NearbyScreen } from "./NearbyScreen";
import { openConversation, type Conversation } from "../lib/chat";
import type { MatchResult } from "../lib/matching";

type MainScreenProps = {
  session: TokenResponse;
  onSignOut: () => void;
};

export type MainTab = "matches" | "detail" | "community" | "nearby" | "chat";

const navItems: Array<{ key: Exclude<MainTab, "chat">; icon: string }> = [
  { key: "matches", icon: "Feed" },
  { key: "detail", icon: "View" },
  { key: "community", icon: "Inbox" },
  { key: "nearby", icon: "Near" },
];

export function MainScreen({ session, onSignOut }: MainScreenProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("matches");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [chatOpenError, setChatOpenError] = useState("");

  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const statusBarHeight = NativeStatusBar.currentHeight ?? 0;
  
  const topInset = Platform.OS === "android" ? statusBarHeight + 18 : 18;
  const androidBottomInset = useMemo(() => {
    if (Platform.OS !== "android") return 0;
    const screenHeight = Dimensions.get("screen").height;
    return Math.max(screenHeight - height - statusBarHeight, 0);
  }, [height, statusBarHeight]);
  
  const safeBottom = Platform.OS === "ios" ? 26 : Math.max(androidBottomInset + 8, 18);
  const bottomNavHeight = 62;
  const bottomNavOffset = safeBottom + 4;

  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const isDetailMode = activeTab === "detail";
  const pagePaddingTop = isDetailMode ? 0 : 96;
  const pagePaddingBottom = isDetailMode ? safeBottom + 28 : bottomNavHeight + bottomNavOffset + 22;
  const contentMinHeight = Math.max(
    height - topInset - pagePaddingTop - pagePaddingBottom,
    520
  );

  const handleOpenDetail = (match: MatchResult) => {
    setSelectedMatch(match);
    setActiveTab("detail");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleOpenConversation = (conversation: Conversation) => {
    setChatOpenError("");
    setActiveConversation(conversation);
    setActiveTab("chat");
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleOpenConversationForMatch = async (matchedUserId: string) => {
    try {
      setChatOpenError("");
      const conversation = await openConversation(
        matchedUserId,
        session.access_token
      );
      handleOpenConversation(conversation);
    } catch (error) {
      setChatOpenError(
        error instanceof Error
          ? error.message
          : "Could not open this conversation yet."
      );
      setActiveTab("community");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "matches":
      case "detail":
        return (
          <DiscoverScreen
            session={session}
            isDetailMode={isDetailMode}
            selectedMatch={selectedMatch}
            onOpenDetail={handleOpenDetail}
            onOpenChat={(matchedUserId) => {
              void handleOpenConversationForMatch(matchedUserId);
            }}
            onCloseDetail={() => setActiveTab("matches")}
            onSignOut={onSignOut}
          />
        );
      case "community":
        return (
          <InboxScreen
            session={session}
            onOpenConversation={handleOpenConversation}
            onChatError={chatOpenError}
            onOpenConversationForMatch={handleOpenConversationForMatch}
          />
        );
      case "nearby":
        // Using an empty array since DiscoverScreen didn't pass real data either in the old version
        return <NearbyScreen nearbyCards={[]} onOpenDetail={handleOpenDetail} />;
      case "chat":
        if (activeConversation) {
          return (
            <ChatThreadScreen
              session={session}
              conversation={activeConversation}
              onBack={() => setActiveTab("community")}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.phoneShell, isDetailMode && styles.phoneShellImmersive]}>
        {!isDetailMode ? (
          <View style={[styles.topSection, { paddingTop: topInset }]}>
            <Text style={styles.heroTitle}>Vibe</Text>
            <Text style={styles.heroTitleAccent}>Match.</Text>
          </View>
        ) : null}

        <ScrollView
          ref={scrollRef}
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.contentScrollInner,
            {
              paddingTop: pagePaddingTop,
              paddingBottom: pagePaddingBottom,
              minHeight: isDetailMode
                ? height + pagePaddingBottom
                : contentMinHeight + pagePaddingTop + pagePaddingBottom,
            },
          ]}
        >
          <View style={styles.innerContent}>
            {renderContent()}
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
              const isActive =
                activeTab === item.key ||
                (activeTab === "chat" && item.key === "community");

              return (
                <Pressable
                  key={item.key}
                  style={styles.bottomNavItem}
                  onPress={() => {
                    setActiveTab(item.key);
                    scrollRef.current?.scrollTo({ y: 0, animated: true });
                  }}
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
    width: "100%",
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
    backgroundColor: "transparent",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 42,
    lineHeight: 42,
    letterSpacing: -1.3,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  heroTitleAccent: {
    color: "#F26A8D",
    fontSize: 42,
    lineHeight: 42,
    letterSpacing: -1.3,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: -4,
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    flexGrow: 1,
  },
  innerContent: {
    flex: 1,
  },
  bottomNav: {
    position: "absolute",
    left: 22,
    right: 22,
    backgroundColor: "rgba(10,8,14,0.72)",
    borderRadius: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bottomNavItem: {
    height: 48,
    width: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavGlow: {
    position: "absolute",
    top: -2,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: "#F26A8D",
    shadowColor: "#F26A8D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  bottomNavIcon: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    letterSpacing: 0.5,
  },
  bottomNavIconActive: {
    color: "#FFFFFF",
    fontFamily: "SpaceGrotesk_700Bold",
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
