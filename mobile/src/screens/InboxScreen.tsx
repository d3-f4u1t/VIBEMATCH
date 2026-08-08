import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import type { TokenResponse } from "../types/auth";
import { getMutualMatches, type MutualMatch } from "../lib/swipe";
import { getConversations, type Conversation } from "../lib/chat";
import type { MatchResult } from "../lib/matching";

type InboxScreenProps = {
  session: TokenResponse;
  onOpenConversation: (conversation: Conversation) => void;
};

// Dummy data from DiscoverScreen
const COMMUNITY_PEOPLE = [
  { name: "Sarah", color: "#FF7B59" },
  { name: "Marcus", color: "#82F7A6" },
  { name: "Elena", color: "#BFD6F3" },
  { name: "David", color: "#F26A8D" },
];

export function InboxScreen({
  session,
  onOpenConversation,
}: InboxScreenProps) {
  const [mutualMatches, setMutualMatches] = useState<MutualMatch[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;
    const loadInboxData = async () => {
      try {
        setLoading(true);
        const [mutualResult, conversationsResult] = await Promise.allSettled([
          getMutualMatches(session.user.id, session.access_token),
          getConversations(session.access_token),
        ]);

        if (isCancelled) return;

        if (mutualResult.status === "fulfilled") {
          setMutualMatches(mutualResult.value);
        } else {
          setMutualMatches([]);
        }

        if (conversationsResult.status === "fulfilled") {
          setConversations(conversationsResult.value);
        } else {
          setConversations([]);
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    loadInboxData();
    return () => {
      isCancelled = true;
    };
  }, [session.access_token, session.user.id]);

  const newMatches = mutualMatches.filter(
    (match) => !conversations.some((conv) => conv.otherUserId === match.userId)
  );

  if (loading && mutualMatches.length === 0 && conversations.length === 0) {
    return (
      <View style={styles.centerStateCard}>
        <ActivityIndicator size="small" color="#82F7A6" />
      </View>
    );
  }

  if (newMatches.length > 0 || conversations.length > 0) {
    return (
      <View style={styles.sectionBody}>
        {newMatches.length > 0 ? (
          <View style={styles.newMatchesSection}>
            <Text style={styles.inboxSectionTitle}>New Matches</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.newMatchesScroll}
              contentContainerStyle={styles.newMatchesScrollContent}
            >
              {newMatches.map((mutualMatch) => (
                <Pressable
                  key={mutualMatch.userId}
                  style={styles.newMatchBubble}
                  onPress={() => {
                    const newConv: Conversation = {
                      id: "new_" + mutualMatch.userId,
                      otherUserId: mutualMatch.userId,
                      otherUserName: mutualMatch.name,
                      otherUserBio: "",
                      otherUserLocationCity: "",
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                      lastMessage: null,
                    };
                    onOpenConversation(newConv);
                  }}
                >
                  <LinearGradient
                    colors={["#F26A8D", "#FF7B59"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.newMatchAvatarGlow}
                  >
                    <View style={styles.newMatchAvatarInside}>
                      <Text style={styles.newMatchAvatarText}>
                        {mutualMatch.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                  <Text style={styles.newMatchLabel} numberOfLines={1}>
                    {mutualMatch.name.split(" ")[0]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.conversationsSection}>
          <Text style={styles.inboxSectionTitle}>Messages</Text>
          {conversations.length === 0 ? (
            <View style={styles.emptyConversationsCard}>
              <Text style={styles.emptyConversationsTitle}>Send the first message</Text>
              <Text style={styles.emptyConversationsBody}>
                Tap one of your new matches above to start a conversation.
              </Text>
            </View>
          ) : (
            conversations.map((conv) => {
              const formattedTime = conv.lastMessage
                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <Pressable
                  key={conv.id}
                  style={styles.conversationRow}
                  onPress={() => onOpenConversation(conv)}
                >
                  <LinearGradient
                    colors={["#BFD6F3", "#7B9BC7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.convAvatarGlow}
                  >
                    <View style={styles.convAvatarInside}>
                      <Text style={styles.convAvatarText}>
                        {conv.otherUserName.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  </LinearGradient>
                  <View style={styles.convDetails}>
                    <View style={styles.convHeader}>
                      <Text style={styles.convName}>{conv.otherUserName}</Text>
                      <Text style={styles.convTime}>{formattedTime}</Text>
                    </View>
                    <Text style={styles.convLastMessage} numberOfLines={1}>
                      {conv.lastMessage ? conv.lastMessage.content : "Vibe check! Send a message."}
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centerStateCard: {
    flex: 1,
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  emptyStateTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
  },
  emptyStateBody: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  feedStageCard: {
    backgroundColor: "rgba(8,8,11,0.48)",
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 24,
  },
  communityStoryCard: {
    gap: 16,
  },
  communityStoryTitle: {
    color: "rgba(255,255,255,0.48)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  communityStoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  communityStoryPill: {
    alignItems: "center",
    gap: 8,
  },
  communityAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  communityAvatarLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  newMatchesSection: {
    marginBottom: 32,
  },
  inboxSectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 16,
    marginLeft: 8,
  },
  newMatchesScroll: {
    marginHorizontal: -16,
  },
  newMatchesScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  newMatchBubble: {
    alignItems: "center",
    width: 72,
    gap: 8,
  },
  newMatchAvatarGlow: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
  },
  newMatchAvatarInside: {
    flex: 1,
    backgroundColor: "#0A080E",
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.08)",
  },
  newMatchAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  newMatchLabel: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
  },
  conversationsSection: {
    flex: 1,
  },
  emptyConversationsCard: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  emptyConversationsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 6,
  },
  emptyConversationsBody: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 16,
  },
  convAvatarGlow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
  },
  convAvatarInside: {
    flex: 1,
    backgroundColor: "#0A080E",
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  convAvatarText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  convDetails: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  convHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  convName: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  convTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  convLastMessage: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
