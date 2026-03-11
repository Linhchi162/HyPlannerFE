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
  Image,
  Modal,
} from "react-native";
import { ChevronLeft, ImagePlus, Send } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
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
import apiClient from "../../api/client";

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
    markChatRead(chatId, params.role).catch(() => { });
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

  const handleSendImage = async () => {
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

    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh để gửi ảnh."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploadingImage(true);
      const asset = result.assets[0];
      const filename = asset.uri.split("/").pop() || "chat-image.jpg";
      const extMatch = /\.(\w+)$/.exec(filename);
      const type = extMatch ? `image/${extMatch[1]}` : "image/jpeg";

      const formData = new FormData();
      formData.append("images", {
        uri: asset.uri,
        name: filename,
        type,
      } as any);

      const uploadResponse = await apiClient.post(
        "/upload/post-images",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadedImageUrl = uploadResponse?.data?.imageUrls?.[0];
      if (!uploadedImageUrl) {
        Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
        return;
      }

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
        text: "",
        imageUrl: uploadedImageUrl,
        senderId,
        senderRole: params?.role === "vendor" ? "vendor" : "user",
        senderImageUrl,
      });
    } catch {
      Alert.alert("Lỗi", "Không thể gửi ảnh. Vui lòng thử lại.");
    } finally {
      setUploadingImage(false);
    }
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
            <ActivityIndicator size="small" color="#f7577c" />
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
                {m.text?.trim() ? (
                  <Text
                    style={[
                      styles.messageText,
                      fromMe ? styles.messageTextMe : styles.messageTextOther,
                    ]}
                  >
                    {m.text}
                  </Text>
                ) : null}
                {m.imageUrl ? (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => setPreviewImage(m.imageUrl || null)}
                  >
                    <Image
                      source={{ uri: m.imageUrl }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ) : null}
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
        <TouchableOpacity
          style={styles.imageBtn}
          onPress={handleSendImage}
          disabled={uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="small" color="#f7577c" />
          ) : (
            <ImagePlus size={18} color="#f7577c" />
          )}
        </TouchableOpacity>
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

      <Modal visible={!!previewImage} transparent>
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewClose}
            onPress={() => setPreviewImage(null)}
          >
            <Text style={styles.previewCloseText}>×</Text>
          </TouchableOpacity>
          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#f7577c",
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
    backgroundColor: "#f7577c",
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
  messageImage: {
    marginTop: responsiveHeight(6),
    width: responsiveWidth(180),
    height: responsiveWidth(180),
    borderRadius: responsiveWidth(10),
    backgroundColor: "#f3f4f6",
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
  imageBtn: {
    width: responsiveWidth(38),
    height: responsiveWidth(38),
    borderRadius: responsiveWidth(19),
    marginRight: responsiveWidth(8),
    backgroundColor: "#fff1f4",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    marginLeft: responsiveWidth(10),
    backgroundColor: "#f7577c",
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    alignItems: "center",
    justifyContent: "center",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.92)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(12),
  },
  previewClose: {
    position: "absolute",
    top: responsiveHeight(42),
    right: responsiveWidth(18),
    zIndex: 2,
    width: responsiveWidth(36),
    height: responsiveWidth(36),
    borderRadius: responsiveWidth(18),
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCloseText: {
    color: "#ffffff",
    fontSize: responsiveFont(24),
    lineHeight: responsiveFont(24),
  },
  previewImage: {
    width: "100%",
    height: "82%",
  },
});
