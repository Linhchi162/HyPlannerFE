import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
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
  ChatSummary,
  subscribeChatsByParticipant,
} from "../../service/chatService";
import { getCachedVendors, subscribeVendors, Vendor } from "../../service/vendorService";

export default function ChatListScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const role = (route.params as { role?: "user" | "vendor" })?.role;
  const currentUser = useSelector(selectCurrentUser);
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const participantId = useMemo(() => {
    if (role === "vendor") return auth.currentUser?.uid || null;
    return (
      currentUser?.id || currentUser?._id || currentUser?.uid || null
    );
  }, [role, currentUser]);

  useEffect(() => {
    if (!participantId) {
      setLoading(false);
      return;
    }
    const unsub = subscribeChatsByParticipant(participantId, (data) => {
      const sorted = [...data].sort((a, b) => {
        const aTime =
          typeof a.updatedAt?.toMillis === "function"
            ? a.updatedAt.toMillis()
            : 0;
        const bTime =
          typeof b.updatedAt?.toMillis === "function"
            ? b.updatedAt.toMillis()
            : 0;
        return bTime - aTime;
      });
      setChats(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [participantId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const cached = await getCachedVendors();
      if (mounted && cached.length > 0) setVendors(cached);
      const unsub = subscribeVendors((data) => {
        if (mounted) setVendors(data);
      });
      return unsub;
    };
    let cleanup: undefined | (() => void);
    load().then((unsub) => {
      cleanup = typeof unsub === "function" ? unsub : undefined;
    });
    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  const vendorMap = useMemo(() => {
    return vendors.reduce<Record<string, Vendor>>((acc, v) => {
      acc[v.id] = v;
      return acc;
    }, {});
  }, [vendors]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
          </View>
        ) : chats.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có tin nhắn.</Text>
        ) : (
          chats.map((c) => {
            const peerName =
              role === "vendor" ? c.userName : c.vendorName;
            const peerImage =
              role === "vendor"
                ? c.userImageUrl || ""
                : c.vendorImageUrl || vendorMap[c.vendorId]?.imageUrl || "";
            const unreadCount =
              role === "vendor" ? c.vendorUnread || 0 : c.userUnread || 0;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.card}
                onPress={() =>
                  navigation.navigate("ChatDetail", {
                    chatId: c.id,
                    userId: c.userId,
                    userName: c.userName,
                    userImageUrl: c.userImageUrl,
                    vendorId: c.vendorId,
                    vendorName: c.vendorName,
                    vendorImageUrl: c.vendorImageUrl,
                    role,
                  })
                }
              >
                {peerImage ? (
                  <Image
                    source={{
                      uri: peerImage,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(peerName || "?").slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <View style={styles.cardTitleRow}>
                    <Text style={styles.cardTitle}>{peerName}</Text>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadText}>
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    {c.lastMessage || "Bắt đầu cuộc trò chuyện"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
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
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    gap: responsiveWidth(10),
  },
  avatar: {
    width: responsiveWidth(38),
    height: responsiveWidth(38),
    borderRadius: responsiveWidth(19),
    backgroundColor: "#fff1f4",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: responsiveWidth(38),
    height: responsiveWidth(38),
    borderRadius: responsiveWidth(19),
    backgroundColor: "#ffe4ea",
  },
  avatarText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#ff5a7a",
  },
  cardInfo: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  cardSub: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  unreadBadge: {
    minWidth: responsiveWidth(22),
    height: responsiveWidth(22),
    borderRadius: responsiveWidth(11),
    backgroundColor: "#ff5a7a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: responsiveWidth(6),
  },
  unreadText: {
    color: "#ffffff",
    fontSize: responsiveFont(10),
    fontFamily: "Montserrat-SemiBold",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(16),
  },
});
