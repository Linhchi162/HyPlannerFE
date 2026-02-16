import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ChevronLeft, Send } from "lucide-react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import { auth } from "../../service/firebase";
import {
  ChatMessage,
  ensureChat,
  markChatRead,
  sendChatMessage,
  subscribeChatMessages,
} from "../../service/chatService";

export default function ChatDetailScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const params = route.params as {
    chatId?: string;
    userId?: string;
    userName?: string;
    userImageUrl?: string;
    vendorId?: string;
    vendorName?: string;
    vendorImageUrl?: string;
    role?: "user" | "vendor";
  };
  const currentUser = useSelector(selectCurrentUser);
  const [chatId, setChatId] = useState<string | null>(
    params?.chatId || null
  );
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const headerTitle = useMemo(() => {
    if (params?.role === "vendor") return params?.userName || "Khách hàng";
    return params?.vendorName || "Nhà cung cấp";
  }, [params?.role, params?.userName, params?.vendorName]);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        if (chatId) return;
        if (params?.role === "vendor") {
          const vendorId = auth.currentUser?.uid;
          const userId = params?.userId;
          if (!vendorId || !userId) return;
          const id = await ensureChat({
            userId,
            vendorId,
            userName: params?.userName || "Khách hàng",
            vendorName: params?.vendorName || "Nhà cung cấp",
            userImageUrl: params?.userImageUrl || null,
            vendorImageUrl: params?.vendorImageUrl || null,
          });
          if (mounted) setChatId(id);
        } else {
          const userId =
            currentUser?.id || currentUser?._id || currentUser?.uid;
          const vendorId = params?.vendorId;
          if (!userId || !vendorId) return;
          const id = await ensureChat({
            userId,
            vendorId,
            userName: currentUser?.name || currentUser?.fullName || "Khách hàng",
            vendorName: params?.vendorName || "Nhà cung cấp",
            userImageUrl: currentUser?.picture || null,
            vendorImageUrl: params?.vendorImageUrl || null,
          });
          if (mounted) setChatId(id);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [
    chatId,
    params?.role,
    params?.userId,
    params?.userName,
    params?.vendorId,
    params?.vendorName,
    currentUser,
  ]);

  useEffect(() => {
    if (!chatId) return;
    const unsub = subscribeChatMessages(chatId, (data) => {
      setMessages(data);
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    if (!params?.role) return;
    markChatRead(chatId, params.role).catch(() => {});
  }, [chatId, params?.role]);

  const handleSend = async () => {
    if (!message.trim()) return;
    if (!chatId) {
      Alert.alert("Lỗi", "Không thể mở cuộc trò chuyện.");
      return;
    }
    const senderId =
      params?.role === "vendor"
        ? auth.currentUser?.uid
        : currentUser?.id || currentUser?._id || currentUser?.uid;
    if (!senderId) {
      Alert.alert("Chưa đăng nhập", "Vui lòng đăng nhập để nhắn tin.");
      return;
    }
    const text = message.trim();
    setMessage("");
    const senderImageUrl =
      params?.role === "vendor"
        ? params?.vendorImageUrl || null
        : currentUser?.picture ||
          currentUser?.avatar ||
          currentUser?.photoUrl ||
          currentUser?.photoURL ||
          null;
    await sendChatMessage({
      chatId,
      text,
      senderId,
      senderRole: params?.role === "vendor" ? "vendor" : "user",
      senderImageUrl,
    });
  };

  const formatMessageTime = (value?: any) => {
    if (!value) return "";
    const date = typeof value?.toDate === "function" ? value.toDate() : value;
    if (!(date instanceof Date)) return "";
    return date.toLocaleString("vi-VN");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : messages.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có tin nhắn.</Text>
        ) : (
          messages.map((m) => {
            const fromMe =
              (params?.role === "vendor" && m.senderRole === "vendor") ||
              (params?.role !== "vendor" && m.senderRole === "user");
            return (
              <View
                key={m.id}
                style={[
                  styles.messageBubble,
                  fromMe ? styles.messageMe : styles.messageOther,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    fromMe ? styles.messageTextMe : styles.messageTextOther,
                  ]}
                >
                  {m.text}
                </Text>
                {m.createdAt ? (
                  <Text
                    style={[
                      styles.messageTime,
                      fromMe ? styles.messageTimeMe : styles.messageTimeOther,
                    ]}
                  >
                    {formatMessageTime(m.createdAt)}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Send size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    height: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
    gap: responsiveHeight(10),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(24),
  },
  loadingText: {
    marginTop: responsiveHeight(8),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(12),
    borderRadius: responsiveWidth(12),
  },
  messageMe: {
    alignSelf: "flex-end",
    backgroundColor: "#ff5a7a",
  },
  messageOther: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  messageText: {
    fontSize: responsiveFont(12),
  },
  messageTextMe: {
    color: "#ffffff",
  },
  messageTextOther: {
    color: "#111827",
  },
  messageTime: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(10),
  },
  messageTimeMe: {
    color: "#ffe4ea",
  },
  messageTimeOther: {
    color: "#9ca3af",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  input: {
    flex: 1,
    height: responsiveHeight(42),
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(20),
    paddingHorizontal: responsiveWidth(12),
    fontSize: responsiveFont(12),
    color: "#111827",
  },
  sendBtn: {
    marginLeft: responsiveWidth(10),
    backgroundColor: "#ff5a7a",
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    alignItems: "center",
    justifyContent: "center",
  },
});
