import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

const navItems: Array<{ key: Exclude<MainTab, "chat">; label: string }> = [
  { key: "matches", label: "Feed" },
  { key: "detail", label: "Profile" },
  { key: "community", label: "Inbox" },
  { key: "nearby", label: "Near" },
];

export function MainScreen({ session, onSignOut }: MainScreenProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("matches");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchResult | null>(null);
  const [chatOpenError, setChatOpenError] = useState("");
  const [liveMatches, setLiveMatches] = useState<MatchResult[]>([]);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  // Industry standard phone: 390x844 (19.5:9) to 430x932 - use 4% horizontal, 2% vertical
  const hPad = Math.round(width * 0.04); // 16 on 400w
  const vGap = Math.round(height * 0.02); // 16-18 on 844h
  const topInset = insets.top;
  const bottomInset = insets.bottom;
  const bottomNavHeight = 62;
  const bottomNavOffset = bottomInset + Math.max(8, Math.round(height * 0.012));
  const isDetailMode = activeTab === "detail";
  // header: topInset + 8 + 44(card) + 12 gap = topInset+64
  const pagePaddingTop = isDetailMode ? 0 : topInset + 64 + vGap;
  const pagePaddingBottom = isDetailMode ? bottomInset + 24 : bottomNavHeight + bottomNavOffset + vGap;
  const contentMinHeight = Math.max(height - topInset - pagePaddingTop - pagePaddingBottom, 520);

  const handleTabChange = (next: Exclude<MainTab, "chat">) => {
    setActiveTab(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleBack = () => {
    if (settingsVisible) {
      setSettingsVisible(false);
      return true;
    }
    if (activeTab === "detail" || activeTab === "chat") {
      setActiveTab("matches");
      setActiveConversation(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return true;
    }
    if (activeTab !== "matches") {
      setActiveTab("matches");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return true;
    }
    return false;
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => handleBack());
    return () => sub.remove();
  }, [activeTab, settingsVisible]);

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
      const conversation = await openConversation(matchedUserId, session.access_token);
      handleOpenConversation(conversation);
    } catch (error) {
      setChatOpenError(error instanceof Error ? error.message : "Could not open this conversation yet.");
      setActiveTab("community");
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleConfirmSignOut = () => {
    setSettingsVisible(false);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: onSignOut },
    ]);
  };

  const canGoBack = activeTab === "detail" || activeTab === "chat";

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
            onMatchesLoaded={setLiveMatches}
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
        return <NearbyScreen nearbyCards={liveMatches} onOpenDetail={handleOpenDetail} />;
      case "chat":
        if (activeConversation) {
          return <ChatThreadScreen session={session} conversation={activeConversation} onBack={() => handleBack()} />;
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={styles.screen}>
      {!isDetailMode ? (
        <View style={[styles.headerWrap, { paddingTop: topInset + 8, paddingHorizontal: hPad }]}>
          <View style={styles.headerCard}>
            <View style={styles.headerLeft}>
              {canGoBack ? (
                <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBack, pressed && styles.headerBackPressed]} accessibilityLabel="Go back">
                  <Text style={styles.headerBackText}>{"‹"}</Text>
                </Pressable>
              ) : null}
              <Text style={styles.logo}>vibematch</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton} onPress={() => setSettingsVisible(true)} accessibilityLabel="Open settings">
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
          </View>
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
            minHeight: isDetailMode ? height + pagePaddingBottom : contentMinHeight + pagePaddingTop + pagePaddingBottom,
          },
        ]}
      >
        <View style={styles.innerContent}>{renderContent()}</View>
      </ScrollView>

      {!isDetailMode ? (
        <View style={[styles.bottomNav, { bottom: bottomNavOffset, height: bottomNavHeight, left: hPad, right: hPad }]}>
          {navItems.map((item) => {
            const isActive = activeTab === item.key || (activeTab === "chat" && item.key === "community");
            return (
              <Pressable
                key={item.key}
                style={styles.bottomNavItem}
                onPress={() => handleTabChange(item.key)}
              >
                {isActive ? <View style={styles.bottomNavGlow} /> : null}
                <Text style={[styles.bottomNavIcon, isActive && styles.bottomNavIconActive]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <Modal visible={settingsVisible} transparent animationType="fade" onRequestClose={() => setSettingsVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsVisible(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Settings</Text>
            <View style={styles.modalDivider} />
            <View style={styles.settingsRow}>
              <Text style={styles.settingsRowLabel}>Account</Text>
              <Text style={styles.settingsRowValue}>{session.user.email}</Text>
            </View>
            <View style={styles.modalDivider} />
            <TouchableOpacity style={styles.signOutButton} onPress={handleConfirmSignOut}>
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = {
  screen: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  headerWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    alignItems: "center",
  },
  headerCard: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    shadowColor: "rgba(11,11,12,0.07)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerBack: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBackPressed: { opacity: 0.7 },
  headerBackText: {
    color: "#0b0b0c",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginTop: -2,
  },
  logo: {
    color: "#0b0b0c",
    fontSize: 23,
    lineHeight: 23,
    letterSpacing: -1.0,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "lowercase",
  },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    color: "rgba(11,11,12,0.52)",
    fontSize: 18,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollInner: {
    flexGrow: 1,
    alignItems: "center",
  },
  innerContent: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    paddingHorizontal: 0,
  },
  bottomNav: {
    position: "absolute",
    maxWidth: 430,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: 31,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    shadowColor: "rgba(11,11,12,0.07)",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 34,
    elevation: 8,
  },
  bottomNavItem: {
    height: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavGlow: {
    position: "absolute",
    top: -2,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: "#ff3d5c",
    shadowColor: "#ff3d5c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
  },
  bottomNavIcon: {
    color: "rgba(11,11,12,0.52)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    letterSpacing: 0.5,
  },
  bottomNavIconActive: {
    color: "#0b0b0c",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11,11,12,0.40)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: "rgba(11,11,12,0.12)",
    shadowColor: "rgba(11,11,12,0.14)",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 12,
  },
  modalHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(11,11,12,0.12)",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#0b0b0c",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(11,11,12,0.12)",
    marginVertical: 12,
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  settingsRowLabel: {
    color: "rgba(11,11,12,0.66)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  settingsRowValue: {
    color: "rgba(11,11,12,0.66)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  signOutButton: {
    marginTop: 8,
    backgroundColor: "rgba(255,61,92,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,61,92,0.30)",
    paddingVertical: 14,
    alignItems: "center",
  },
  signOutButtonText: {
    color: "#e11d48",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 0.3,
  },
  cancelButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "rgba(11,11,12,0.52)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
  },
} as const;
