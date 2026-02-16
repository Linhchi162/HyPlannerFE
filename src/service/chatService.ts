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
  text: string;
  senderId: string;
  senderRole: ChatRole;
  createdAt?: any;
};

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
  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatSummary, "id">),
    }));
    callback(data);
  });
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
  const unsub = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ChatMessage, "id">),
    }));
    callback(data);
  });
  return unsub;
};

export const sendChatMessage = async (params: {
  chatId: string;
  text: string;
  senderId: string;
  senderRole: ChatRole;
  senderImageUrl?: string | null;
}) => {
  const { chatId, text, senderId, senderRole, senderImageUrl } = params;
  await addDoc(collection(db, "chats", chatId, "messages"), {
    text,
    senderId,
    senderRole,
    createdAt: serverTimestamp(),
  });
  const unreadField = senderRole === "user" ? "vendorUnread" : "userUnread";
  const chatUpdate: Record<string, any> = {
    lastMessage: text,
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
};

export const markChatRead = async (chatId: string, role: ChatRole) => {
  const field = role === "vendor" ? "vendorUnread" : "userUnread";
  await updateDoc(doc(db, "chats", chatId), { [field]: 0 });
};
