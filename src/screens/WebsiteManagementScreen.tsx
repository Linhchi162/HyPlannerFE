import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import {
  ChevronLeft,
  Share2,
  QrCode,
  Globe,
  Users,
  MessageSquareText,
  Info,
  Image,
  BookHeart,
  CalendarDays,
  Gift,
  Music,
  Palette,
  Settings2,
  Crown,
  Youtube,
} from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useAppDispatch } from "../store/hooks";
import { fetchUserInvitation } from "../store/invitationSlice";
import apiClient from "../api/client";

type WebsiteManagementRouteProp = RouteProp<
  RootStackParamList,
  "WebsiteManagement"
>;

export default function WebsiteManagementScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<WebsiteManagementRouteProp>();
  const { invitation } = route.params;
  const dispatch = useAppDispatch();

  const websiteUrl = `https://hy-planner-be.vercel.app/inviletter/${invitation.slug}`;

  const handleDeleteWebsite = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa website này không? Mọi dữ liệu liên quan sẽ bị mất vĩnh viễn.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiClient.delete(
                "/invitation/my-invitation"
              );

              Alert.alert("Thành công", response.data.message);

              // Cập nhật lại Redux state (để data trở thành null)
              dispatch(fetchUserInvitation());

              // Quay về màn hình Home
              navigation.navigate("Main", { screen: "Home" });
            } catch (error: any) {
              Alert.alert("Lỗi", error.message || "Không thể xóa website.");
            }
          },
        },
      ]
    );
  };

  const showComingSoonAlert = () => {
    Alert.alert(
      "Sắp ra mắt",
      "Chức năng này đang được phát triển. Vui lòng quay lại sau!"
    );
  };

  const menuItems = [
    {
      icon: Info,
      label: "Thông tin cô dâu chú rể",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "coupleInfo",
          title: "Thông tin cặp đôi",
        }),
    },
    {
      icon: Youtube,
      label: "Video Kỷ Niệm",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "youtubeVideo",
          title: "Video Kỷ Niệm",
        }),
    },
    {
      icon: Image,
      label: "Album ảnh",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "album",
          title: "Chỉnh sửa Album",
        }),
    },
    {
      icon: BookHeart,
      label: "Chuyện tình yêu",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "loveStory",
          title: "Chuyện Tình Yêu",
        }),
    },
    {
      icon: CalendarDays,
      label: "Sự kiện cưới",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "events",
          title: "Chương Trình Cưới",
        }),
    },
    {
      icon: Gift,
      label: "Hộp mừng cưới",
      isPremium: true,
      action: showComingSoonAlert,
    },
    {
      icon: Music,
      label: "Nhạc và hiệu ứng",
      isPremium: true,
      action: showComingSoonAlert,
    },
    {
      icon: Palette,
      label: "Thay đổi giao diện",
      isPremium: true,
      action: showComingSoonAlert,
    },
    {
      icon: Settings2,
      label: "Chỉnh sửa giao diện",
      action: showComingSoonAlert,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fbe2e7" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Website</Text>
        <TouchableOpacity>
          <Share2 size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Grid Buttons */}
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#2ecc71" }]}
          >
            <QrCode color="#fff" size={24} />
            <Text style={styles.gridButtonText}>TẠO MÃ QR</Text>
            <Text style={styles.gridButtonSubText}>Mã QR cho website</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#3498db" }]}
            onPress={() =>
              Linking.openURL(websiteUrl).catch(() =>
                Alert.alert("Lỗi", "Không thể mở đường dẫn này.")
              )
            }
          >
            <Globe color="#fff" size={24} />
            <Text style={styles.gridButtonText}>MỞ WEBSITE</Text>
            <Text style={styles.gridButtonSubText}>Xem website của bạn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#e74c3c" }]}
          >
            <Users color="#fff" size={24} />
            <Text style={styles.gridButtonText}>KHÁCH MỜI</Text>
            <Text style={styles.gridButtonSubText}>Tất cả khách mời: 0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#95a5a6" }]}
          >
            <MessageSquareText color="#fff" size={24} />
            <Text style={styles.gridButtonText}>LỜI CHÚC</Text>
            <Text style={styles.gridButtonSubText}>Tất cả lời chúc: 0</Text>
          </TouchableOpacity>
        </View>

        {/* Menu List */}
        <View style={styles.menuList}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.action}
              disabled={!item.action}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <item.icon size={22} color={!item.action ? "#ccc" : "#555"} />
                <Text
                  style={[
                    styles.menuItemText,
                    !item.action && { color: "#ccc" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {item.isPremium && <Crown size={20} color="#f1c40f" />}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleDeleteWebsite}
          >
            <Text style={[styles.menuItemText, styles.deleteText]}>
              Xóa Website
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: StatusBar.currentHeight || 0,
  },
  header: {
    backgroundColor: "#fbe2e7",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0d4d9",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: 18,
    fontWeight: "600",
    color: "#e07181",
  },
  container: { padding: 16, backgroundColor: "#f7f7f7" },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridButton: {
    width: "48%",
    height: 100,
    borderRadius: 12,
    padding: 12,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  gridButtonText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  gridButtonSubText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#fff",
    fontSize: 12,
  },
  menuList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    marginLeft: 16,
    color: "#333",
  },
  deleteText: {
    color: "#e74c3c", // Màu đỏ để cảnh báo
    textAlign: "center",
    width: "100%",
    fontFamily: "Montserrat-SemiBold",
  },
});
