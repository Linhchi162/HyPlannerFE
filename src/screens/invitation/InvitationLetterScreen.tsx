import React, { useMemo, useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { ChevronLeft, Crown } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { NavigationProp, useNavigation } from "@react-navigation/core";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../store/authSlice";
import invitationClient from "../../api/invitationClient";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";

// shared color palette used across app
const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#374151",
  textSecondary: "#6D6D6D",
  primary: "#ff5a7a",
  accent: "#e07181",
  white: "#FFFFFF",
};

// Lấy base URL từ apiClient hoặc định nghĩa hằng số
// Đảm bảo rằng process.env.EXPO_PUBLIC_BASE_URL đã được định nghĩa trong file .env của bạn
const BACKEND_URL =
  process.env.EXPO_PUBLIC_INVITATION_BASE_URL ||
  process.env.EXPO_PUBLIC_BASE_URL ||
  "https://hy-planner-be.vercel.app";

const normalizeTemplateType = (type?: string) => {
  if (!type) return "Miễn phí";
  return type.toUpperCase().includes("VIP") ? "VIP" : "Miễn phí";
};

export type Template = {
  id: number;
  name: string;
  type: string;
  image: string;
};

type TemplateHealthStatus = "unknown" | "checking" | "ok" | "error";

// Component Card cho từng mẫu thiệp
const TemplateCard = ({
  template,
  navigation,
  userAccountType,
  healthStatus,
}: {
  template: Template;
  navigation: NavigationProp<RootStackParamList>;
  userAccountType: string;
  healthStatus: TemplateHealthStatus;
}) => {
  const templateType = normalizeTemplateType(template.type);
  const isTemplateAvailable = healthStatus === "ok" || healthStatus === "unknown";

  const handleUseTemplate = () => {
    if (!isTemplateAvailable) {
      Alert.alert(
        "Mẫu đang lỗi trên server",
        "Mẫu này hiện render bị lỗi (backend trả về 500) nên chưa thể dùng. Bạn có thể chọn mẫu khác, hoặc chạy BE local / deploy BE mới để dùng mẫu này."
      );
      return;
    }

    // Kiểm tra quyền truy cập VIP template
    if (templateType === "VIP" && userAccountType === "FREE") {
      Alert.alert(
        "Nâng cấp tài khoản",
        "Mẫu thiệp này chỉ dành cho tài khoản VIP. Vui lòng nâng cấp tài khoản để sử dụng.",
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Nâng cấp ngay",
            onPress: () => {
              navigation.navigate("UpgradeAccountScreen");
            },
          },
        ]
      );
      return;
    }

    Alert.alert(
      "Xác nhận sử dụng",
      `Bạn có muốn tiếp tục với mẫu "${template.name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
          onPress: () => {
            navigation.navigate("CreateWeddingSite", { template: template });
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    if (!isTemplateAvailable) {
      Alert.alert(
        "Không thể xem mẫu",
        "Backend hiện không render được mẫu này. Vui lòng chọn mẫu khác (hoặc chạy BE local/deploy mới)."
      );
      return;
    }
    // URL này cần khớp với cấu trúc route public trên backend của bạn
    const previewUrl = `${BACKEND_URL}/inviletter/preview/${template.id}`;
    Linking.openURL(previewUrl).catch((err) =>
      Alert.alert("Lỗi", "Không thể mở trang xem thử.")
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardImageContainer}>
        <Image
          source={{ uri: template.image }}
          style={styles.cardImage}
          resizeMode="cover"
        />
        <View style={styles.badgeContainer}>
          <Text
            style={[
              styles.badgeText,
              templateType === "VIP" ? styles.vipBadge : styles.freeBadge,
            ]}
          >
            {templateType}
          </Text>
        </View>

        {healthStatus === "checking" && (
          <View style={styles.healthBadge}>
            <Text style={styles.healthBadgeText}>Đang kiểm tra…</Text>
          </View>
        )}
        {healthStatus === "error" && (
          <View style={[styles.healthBadge, styles.healthBadgeError]}>
            <Text style={styles.healthBadgeText}>Bảo trì</Text>
          </View>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handlePreview}
          disabled={!isTemplateAvailable}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            Mẫu thử
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            templateType === "VIP" &&
            userAccountType === "FREE" &&
            styles.lockedButton,
            !isTemplateAvailable && styles.disabledButton,
          ]}
          onPress={handleUseTemplate}
          disabled={!isTemplateAvailable}
        >
          {templateType === "VIP" && userAccountType === "FREE" && (
            <Crown size={16} color="#ffffff" style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {templateType === "VIP" && userAccountType === "FREE"
              ? "Nâng cấp"
              : "Sử dụng"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function InvitationLetterScreen() {
  const [activeTab, setActiveTab] = useState("Tất cả");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const currentUser = useSelector(selectCurrentUser);
  const userAccountType = String(currentUser?.accountType || "FREE").toUpperCase();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templateHealth, setTemplateHealth] = useState<
    Record<number, TemplateHealthStatus>
  >({});

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await invitationClient.get("/templates");
        setTemplates(response.data);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách mẫu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const baseUrl = BACKEND_URL.replace(/\/+$/, "");
    const ids = templates.map((t) => t.id);

    if (ids.length === 0) return;

    // init unknown/checking states
    setTemplateHealth((prev) => {
      const next = { ...prev };
      for (const id of ids) {
        if (!next[id]) next[id] = "unknown";
      }
      return next;
    });

    const concurrency = 4;
    let idx = 0;

    const worker = async () => {
      while (!cancelled && idx < ids.length) {
        const id = ids[idx++];
        setTemplateHealth((prev) => ({ ...prev, [id]: "checking" }));
        try {
          const resp = await fetch(`${baseUrl}/inviletter/preview/${id}`, {
            method: "GET",
          });
          const ok = resp.ok;
          if (!cancelled) {
            setTemplateHealth((prev) => ({ ...prev, [id]: ok ? "ok" : "error" }));
          }
        } catch {
          if (!cancelled) {
            setTemplateHealth((prev) => ({ ...prev, [id]: "error" }));
          }
        }
      }
    };

    Promise.all(Array.from({ length: concurrency }, () => worker()));

    return () => {
      cancelled = true;
    };
  }, [templates]);

  const filteredTemplates = templates.filter((template) => {
    if (activeTab === "Tất cả") return true;
    if (activeTab === "VIP") return normalizeTemplateType(template.type) === "VIP";
    if (activeTab === "Miễn phí")
      return normalizeTemplateType(template.type) === "Miễn phí";
    return true;
  });

  const renderHeader = () => (
    <View style={styles.filterTabsContainer}>
      {["Tất cả", "Miễn phí", "VIP"].map((tab) => (
        <TouchableOpacity
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={[
            styles.tabButton,
            activeTab === tab ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Đang tải danh sách mẫu...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={{ color: "red" }}>Lỗi: {error}</Text>
        <Text>Vui lòng thử lại sau.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary}
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Chọn Mẫu Thiệp Cưới
          </Text>
        </View>
        <View style={{ width: responsiveWidth(24) }} />
      </View>
      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            navigation={navigation}
            userAccountType={userAccountType}
            healthStatus={templateHealth[item.id] || "unknown"}
          />
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.card,
    height: responsiveHeight(56),
  },
  headerTitle: {
    fontFamily: "MavenPro-Bold",
    fontSize: responsiveFont(20),
    fontWeight: "700",
    color: COLORS.white,
  },
  filterTabsContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
  },
  activeTabText: {
    color: "#ffffff",
  },
  inactiveTabText: {
    color: "#4b5563",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
    borderColor: "#ddd8d8ff",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  cardImageContainer: {
    height: 400,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  badgeContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
  },
  healthBadge: {
    position: "absolute",
    left: 16,
    top: 16,
    zIndex: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    backgroundColor: "rgba(17, 24, 39, 0.75)",
  },
  healthBadgeError: {
    backgroundColor: "rgba(220, 38, 38, 0.85)",
  },
  healthBadgeText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#ffffff",
    fontSize: 12,
  },
  badgeText: {
    fontFamily: "Montserrat-Medium",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
    overflow: "hidden",
  },
  vipBadge: {
    backgroundColor: COLORS.primary,
  },
  freeBadge: {
    backgroundColor: "#366d4a",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineButton: {
    backgroundColor: "#f3f4f6",
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
  },
  lockedButton: {
    backgroundColor: "#9ca3af",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    fontWeight: "600",
  },
  outlineButtonText: {
    color: "#4b5563",
  },
  primaryButtonText: {
    color: COLORS.white,
  },
});
