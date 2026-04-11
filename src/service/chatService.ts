import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  addDoc,
  updateDoc,
  where,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import { sendExpoPushToTokens } from "./expoPushService";

export type ChatRole = "user" | "vendor";

export type ChatSummary = {
  id: string;
  userId: string;
  vendorId: string;
  userName: string;
  vendorName: string;
  userImageUrl?: string;
  vendorImageUrl?: string;
  userUnread?: number;
  vendorUnread?: number;
  lastMessage?: string;
  lastSenderId?: string;
  lastSenderRole?: ChatRole;
  updatedAt?: any;
};

export type ChatMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  senderId: string;
  senderRole: ChatRole;
  createdAt?: any;
};

async function readPushTokens(
  collectionName: "users" | "vendors",
  id: string
): Promise<string[]> {
  if (!id) return [];
  try {
    const snap = await getDoc(doc(db, collectionName, id));
    if (!snap.exists()) return [];
    const raw = snap.data();
    const arr = Array.isArray(raw?.fcmTokens) ? raw.fcmTokens : [];
    const maybeSingle = typeof raw?.pushToken === "string" ? [raw.pushToken] : [];
    return [...arr, ...maybeSingle];
  } catch (error) {
    console.error(`[chatService] readPushTokens ${collectionName}/${id}`, error);
    return [];
  }
}

export const getChatId = (userId: string, vendorId: string) =>
  `chat_${userId}_${vendorId}`;

export const ensureChat = async (params: {
  userId: string;
  vendorId: string;
  userName: string;
  vendorName: string;
  userImageUrl?: string | null;
  vendorImageUrl?: string | null;
}) => {
  const { userId, vendorId, userName, vendorName, userImageUrl, vendorImageUrl } =
    params;
  const chatId = getChatId(userId, vendorId);
  const ref = doc(db, "chats", chatId);
  const existing = await getDoc(ref);
  const payload = {
    userId,
    vendorId,
    userName,
    vendorName,
    userImageUrl: userImageUrl || null,
    vendorImageUrl: vendorImageUrl || null,
    participants: [userId, vendorId],
    updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) {
    await setDoc(ref, {
      ...payload,
      createdAt: serverTimestamp(),
      lastMessage: "",
      userUnread: 0,
      vendorUnread: 0,
    });
  } else {
    await setDoc(ref, payload, { merge: true });
  }
  return chatId;
};

export const subscribeChatsByParticipant = (
  participantId: string,
  callback: (chats: ChatSummary[]) => void
) => {
  const q = query(
    collection(db, "chats"),
    where("participants", "array-contains", participantId)
  );
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatSummary, "id">),
      }));
      callback(data);
    },
    (error) => {
      console.error("[chatService] subscribeChatsByParticipant", error);
      callback([]);
    }
  );
  return unsub;
};

export const subscribeChatMessages = (
  chatId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  const unsub = onSnapshot(
    q,
    (snapshot) => {
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ChatMessage, "id">),
      }));
      callback(data);
    },
    (error) => {
      console.error("[chatService] subscribeChatMessages", error);
      callback([]);
    }
  );
  return unsub;
};

export const sendChatMessage = async (params: {
  chatId: string;
  text?: string;
  imageUrl?: string | null;
  senderId: string;
  senderRole: ChatRole;
  senderImageUrl?: string | null;
}) => {
  const { chatId, text, imageUrl, senderId, senderRole, senderImageUrl } = params;
  const normalizedText = text?.trim() || "";
  const normalizedImageUrl = imageUrl || null;

  if (!normalizedText && !normalizedImageUrl) {
    throw new Error("Message requires text or image.");
  }

  await addDoc(collection(db, "chats", chatId, "messages"), {
    text: normalizedText,
    ...(normalizedImageUrl ? { imageUrl: normalizedImageUrl } : {}),
    senderId,
    senderRole,
    createdAt: serverTimestamp(),
  });
  const unreadField = senderRole === "user" ? "vendorUnread" : "userUnread";
  const previewMessage = normalizedText || "[Hình ảnh]";
  const chatUpdate: Record<string, any> = {
    lastMessage: previewMessage,
    updatedAt: serverTimestamp(),
    lastSenderId: senderId,
    lastSenderRole: senderRole,
  };
  await updateDoc(doc(db, "chats", chatId), {
    ...chatUpdate,
    [unreadField]: increment(1),
  });
  if (senderImageUrl) {
    await updateDoc(doc(db, "chats", chatId), {
      ...(senderRole === "user" ? { userImageUrl: senderImageUrl } : {}),
      ...(senderRole === "vendor" ? { vendorImageUrl: senderImageUrl } : {}),
    });
  }

  try {
    const chatSnap = await getDoc(doc(db, "chats", chatId));
    if (!chatSnap.exists()) return;
    const chat = chatSnap.data() as ChatSummary;
    const receiverRole: ChatRole = senderRole === "user" ? "vendor" : "user";
    const receiverId = receiverRole === "vendor" ? chat.vendorId : chat.userId;
    const receiverName =
      receiverRole === "vendor" ? chat.vendorName || "Nhà cung cấp" : chat.userName || "Khách hàng";
    const tokens = await readPushTokens(
      receiverRole === "vendor" ? "vendors" : "users",
      receiverId
    );
    await sendExpoPushToTokens(tokens, {
      title: senderRole === "user" ? "Tin nhắn từ khách hàng" : "Tin nhắn từ nhà cung cấp",
      body: normalizedText || "Bạn nhận được một hình ảnh mới.",
      data: {
        type: "chat_message",
        chatId,
        role: receiverRole,
        participantName: receiverName,
      },
    });
  } catch (error) {
    console.error("[chatService] push message notify", error);
  }
};

export const markChatRead = async (chatId: string, role: ChatRole) => {
  const field = role === "vendor" ? "vendorUnread" : "userUnread";
  await updateDoc(doc(db, "chats", chatId), { [field]: 0 });
};
