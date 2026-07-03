import { API_BASE_URL } from "./config";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserBio: string;
  otherUserLocationCity: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: ChatMessage | null;
};

type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ApiConversation = {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_bio: string;
  other_user_location_city: string;
  created_at: string;
  updated_at: string;
  last_message: ApiMessage | null;
};

type ConversationListResponse = {
  conversations?: ApiConversation[];
  detail?: string;
};

type MessageListResponse = {
  messages?: ApiMessage[];
  detail?: string;
};

function buildAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function parseErrorMessage(data: unknown, fallback: string) {
  if (
    data &&
    typeof data === "object" &&
    "detail" in data &&
    typeof (data as { detail?: unknown }).detail === "string"
  ) {
    return (data as { detail: string }).detail;
  }

  return fallback;
}

function mapMessage(message: ApiMessage): ChatMessage {
  return {
    id: message.id,
    conversationId: message.conversation_id,
    senderId: message.sender_id,
    content: message.content,
    createdAt: message.created_at,
  };
}

function mapConversation(conversation: ApiConversation): Conversation {
  return {
    id: conversation.id,
    otherUserId: conversation.other_user_id,
    otherUserName: conversation.other_user_name,
    otherUserBio: conversation.other_user_bio,
    otherUserLocationCity: conversation.other_user_location_city,
    createdAt: conversation.created_at,
    updatedAt: conversation.updated_at,
    lastMessage: conversation.last_message
      ? mapMessage(conversation.last_message)
      : null,
  };
}

export async function openConversation(
  matchedUserId: string,
  token: string
): Promise<Conversation> {
  const response = await fetch(
    `${API_BASE_URL}/chat/conversations/${encodeURIComponent(matchedUserId)}`,
    {
      method: "POST",
      headers: buildAuthHeaders(token),
    }
  );

  const data = (await response.json()) as ApiConversation & { detail?: string };

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to open conversation."));
  }

  return mapConversation(data);
}

export async function getConversations(token: string): Promise<Conversation[]> {
  const response = await fetch(`${API_BASE_URL}/chat/conversations`, {
    method: "GET",
    headers: buildAuthHeaders(token),
  });

  const data = (await response.json()) as ConversationListResponse;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to load conversations."));
  }

  return (data.conversations ?? []).map(mapConversation);
}

export async function getMessages(
  conversationId: string,
  token: string
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE_URL}/chat/conversations/${encodeURIComponent(
      conversationId
    )}/messages`,
    {
      method: "GET",
      headers: buildAuthHeaders(token),
    }
  );

  const data = (await response.json()) as MessageListResponse;

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to load messages."));
  }

  return (data.messages ?? []).map(mapMessage);
}

export async function sendMessage(
  conversationId: string,
  content: string,
  token: string
): Promise<ChatMessage> {
  const response = await fetch(
    `${API_BASE_URL}/chat/conversations/${encodeURIComponent(
      conversationId
    )}/messages`,
    {
      method: "POST",
      headers: buildAuthHeaders(token),
      body: JSON.stringify({ content }),
    }
  );

  const data = (await response.json()) as ApiMessage & { detail?: string };

  if (!response.ok) {
    throw new Error(parseErrorMessage(data, "Unable to send message."));
  }

  return mapMessage(data);
}
