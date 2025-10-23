import React, { useCallback, useState } from "react"; // --- THÊM useState
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
  ActivityIndicator,
  Modal, // --- THÊM
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
  CreditCard,
  Copy, // --- THÊM
  X, // --- THÊM
} from "lucide-react-native";
import {
  useNavigation,
  NavigationProp,
  useFocusEffect,
} from "@react-navigation/native";
import { RootStackParamList } from "../navigation/types";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchUserInvitation,
  selectUserInvitation,
} from "../store/invitationSlice";
import apiClient from "../api/client";
import QRCode from "react-native-qrcode-svg"; // --- THÊM
import Clipboard from "@react-native-clipboard/clipboard"; // --- THÊM

export default function WebsiteManagementScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const [isModalVisible, setModalVisible] = useState(false); // --- THÊM STATE CHO MODAL

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchUserInvitation());
    }, [dispatch])
  );

  const invitation = useAppSelector(selectUserInvitation);

  // --- THÊM HÀM SAO CHÉP ---
  const copyToClipboard = (url: string) => {
    Clipboard.setString(url);
    Alert.alert("Đã sao chép", "Đã sao chép đường dẫn website vào bộ nhớ.");
  };

  if (!invitation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Đang tải...</Text>
          <View style={{ width: 24 }} />
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f7f7f7",
          }}
        >
          <ActivityIndicator size="large" color="#e07181" />
        </View>
      </SafeAreaView>
    );
  }

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
              dispatch(fetchUserInvitation());
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
      icon: CreditCard,
      label: "QR ngân hàng mừng cưới",
      action: () =>
        navigation.navigate("EditCoupleInfo", {
          invitation,
          sectionType: "bankAccount",
          title: "QR Mừng Cưới",
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
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#2ecc71" }]}
            onPress={() => setModalVisible(true)} // --- SỬA DÒNG NÀY ---
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
            <Text style={styles.gridButtonSubText}>
              Tất cả khách mời: {invitation.guestRsvpCount || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#95a5a6" }]}
          >
            <MessageSquareText color="#fff" size={24} />
            <Text style={styles.gridButtonText}>LỜI CHÚC</Text>
            <Text style={styles.gridButtonSubText}>
              Tất cả lời chúc: {invitation.guestbookMessages?.length || 0}
            </Text>
          </TouchableOpacity>
        </View>

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

      {/* --- THÊM TOÀN BỘ MODAL --- */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => {
          setModalVisible(!isModalVisible);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <X size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Mã QR Website</Text>

            <View
              style={{
                padding: 10,
                backgroundColor: "white",
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <QRCode value={websiteUrl} size={220} />
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#555",
                marginBottom: 10,
                fontFamily: "Montserrat-Medium",
              }}
            >
              Hoặc sao chép đường dẫn:
            </Text>
            <View style={styles.modalLinkContainer}>
              <Text style={styles.modalLinkText} numberOfLines={1}>
                {websiteUrl}
              </Text>
              <TouchableOpacity onPress={() => copyToClipboard(websiteUrl)}>
                <Copy size={22} color="#e07181" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  container: { padding: 16, backgroundColor: "#f7f7f7", paddingBottom: 100 }, // Thêm paddingBottom
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
    color: "#e74c3c",
    textAlign: "center",
    width: "100%",
    fontFamily: "Montserrat-SemiBold",
  },

  // --- THÊM STYLES CHO MODAL ---
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    paddingTop: 40, // Chừa chỗ cho nút close
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Montserrat-SemiBold",
    color: "#e07181",
  },
  modalLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    width: "100%",
  },
  modalLinkText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Montserrat-Medium",
    color: "#333",
    marginRight: 10,
  },
});
