import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { TokenResponse } from "../types/auth";
import {
  getMessages,
  sendMessage,
  type ChatMessage,
  type Conversation,
} from "../lib/chat";

type ChatThreadScreenProps = {
  session: TokenResponse;
  conversation: Conversation;
  onBack: () => void;
};

export function ChatThreadScreen({
  session,
  conversation,
  onBack,
}: ChatThreadScreenProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    const loadMessages = async () => {
      try {
        setChatLoading(true);
        const msgs = await getMessages(conversation.id, session.access_token);
        if (!isCancelled) {
          setChatMessages(msgs);
        }
      } catch (err) {
        if (!isCancelled) {
          setChatError(err instanceof Error ? err.message : "Failed to load messages");
        }
      } finally {
        if (!isCancelled) {
          setChatLoading(false);
        }
      }
    };

    loadMessages();

    return () => {
      isCancelled = true;
    };
  }, [conversation.id, session.access_token]);

  const handleSendChatMessage = async () => {
    const content = chatDraft.trim();
    if (!content || chatLoading) return;

    setChatLoading(true);
    setChatError("");

    try {
      const message = await sendMessage(
        conversation.id,
        content,
        session.access_token
      );
      setChatMessages((prev) => [...prev, message]);
      setChatDraft("");
    } catch (sendError) {
      setChatError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send this message."
      );
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <View style={styles.sectionBody}>
      <View style={styles.chatHeaderCard}>
        <Pressable style={styles.chatBackButton} onPress={onBack}>
          <Text style={styles.chatBackText}>{"<"}</Text>
        </Pressable>
        <View style={styles.chatHeaderCopy}>
          <Text style={styles.chatHeaderTitle}>
            {conversation.otherUserName}
          </Text>
          <Text style={styles.chatHeaderMeta}>
            {conversation.otherUserLocationCity ||
              "Matched through shared music"}
          </Text>
        </View>
      </View>

      {chatError ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>{chatError}</Text>
        </View>
      ) : null}

      <View style={styles.chatMessagePanel}>
        {chatMessages.length === 0 ? (
          <View style={styles.chatEmptyState}>
            <Text style={styles.chatEmptyTitle}>Say something real.</Text>
            <Text style={styles.chatEmptyBody}>
              Start with the song, artist, or energy that made this match feel
              familiar.
            </Text>
          </View>
        ) : (
          chatMessages.map((message) => {
            const isMine = message.senderId === session.user.id;

            return (
              <View
                key={message.id}
                style={[
                  styles.chatBubble,
                  isMine ? styles.chatBubbleMine : styles.chatBubbleTheirs,
                ]}
              >
                <Text
                  style={[
                    styles.chatBubbleText,
                    isMine && styles.chatBubbleTextMine,
                  ]}
                >
                  {message.content}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.chatComposer}>
        <TextInput
          value={chatDraft}
          onChangeText={setChatDraft}
          placeholder="Message them..."
          placeholderTextColor="rgba(255,255,255,0.42)"
          style={styles.chatInput}
          multiline
        />
        <Pressable
          style={[
            styles.chatSendButton,
            (!chatDraft.trim() || chatLoading) && styles.actionDisabled,
          ]}
          onPress={handleSendChatMessage}
          disabled={!chatDraft.trim() || chatLoading}
        >
          <Text style={styles.chatSendText}>{chatLoading ? "..." : "Send"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionBody: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flex: 1,
  },
  chatHeaderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chatBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  chatBackText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  chatHeaderCopy: {
    flex: 1,
    justifyContent: "center",
  },
  chatHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  chatHeaderMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  infoBanner: {
    backgroundColor: "rgba(242,106,141,0.12)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(242,106,141,0.2)",
  },
  infoBannerText: {
    color: "#F26A8D",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_500Medium",
    textAlign: "center",
  },
  chatMessagePanel: {
    flex: 1,
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  chatEmptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  chatEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    marginBottom: 8,
    textAlign: "center",
  },
  chatEmptyBody: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_400Regular",
    textAlign: "center",
  },
  chatBubble: {
    maxWidth: "80%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  chatBubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderBottomLeftRadius: 4,
  },
  chatBubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: "#82F7A6",
    borderBottomRightRadius: 4,
  },
  chatBubbleText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: "SpaceGrotesk_500Medium",
    color: "#FFFFFF",
  },
  chatBubbleTextMine: {
    color: "#08080B",
  },
  chatComposer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 24,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  chatInput: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  chatSendButton: {
    width: 64,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  chatSendText: {
    color: "#000000",
    fontSize: 14,
    fontFamily: "SpaceGrotesk_700Bold",
  },
});
