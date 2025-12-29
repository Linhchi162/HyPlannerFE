import React, { useState, useEffect } from "react";
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
import apiClient from "../../api/client";

// Lấy base URL từ apiClient hoặc định nghĩa hằng số
// Đảm bảo rằng process.env.EXPO_PUBLIC_BASE_URL đã được định nghĩa trong file .env của bạn
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BASE_URL || "https://hy-planner-be.vercel.app";

export type Template = {
  id: number;
  name: string;
  type: string;
  image: string;
};

// Component Card cho từng mẫu thiệp
const TemplateCard = ({
  template,
  navigation,
  userAccountType,
}: {
  template: Template;
  navigation: NavigationProp<RootStackParamList>;
  userAccountType: string;
}) => {
  const handleUseTemplate = () => {
    // Kiểm tra quyền truy cập VIP template
    if (template.type === "VIP" && userAccountType === "FREE") {
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
              template.type === "VIP" ? styles.vipBadge : styles.freeBadge,
            ]}
          >
            {template.type}
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.outlineButton]}
          onPress={handlePreview}
        >
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            Mẫu thử
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.primaryButton,
            template.type === "VIP" &&
              userAccountType === "FREE" &&
              styles.lockedButton,
          ]}
          onPress={handleUseTemplate}
        >
          {template.type === "VIP" && userAccountType === "FREE" && (
            <Crown size={16} color="#ffffff" style={{ marginRight: 6 }} />
          )}
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {template.type === "VIP" && userAccountType === "FREE"
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
  const userAccountType = currentUser?.accountType || "FREE";

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await apiClient.get("/templates");
        setTemplates(response.data);
      } catch (err: any) {
        setError(err.message || "Không thể tải danh sách mẫu.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const filteredTemplates = templates.filter((template) => {
    if (activeTab === "Tất cả") return true;
    return template.type === activeTab;
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
        <ActivityIndicator size="large" color="#e07181" />
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
        barStyle="dark-content"
        backgroundColor="#f4d7ddff"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn Mẫu Thiệp Cưới</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={filteredTemplates}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            navigation={navigation}
            userAccountType={userAccountType}
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
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#f4d7ddff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: 18,
    fontWeight: "600",
    color: "#e07181",
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
    backgroundColor: "#e07181",
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
    backgroundColor: "#e07181",
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
    backgroundColor: "#e07181",
    flexDirection: "row",
    alignItems: "center",
  },
  lockedButton: {
    backgroundColor: "#9ca3af",
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
    color: "#ffffff",
  },
});
