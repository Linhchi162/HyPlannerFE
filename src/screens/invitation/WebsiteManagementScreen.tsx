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
  Platform,
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
import { RootStackParamList } from "../../navigation/types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchUserInvitation,
  selectUserInvitation,
} from "../../store/invitationSlice";
import apiClient from "../../api/client";
import QRCode from "react-native-qrcode-svg"; // --- THÊM
import Clipboard from "@react-native-clipboard/clipboard"; // --- THÊM
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WebsiteManagementScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const [isModalVisible, setModalVisible] = useState(false); // --- THÊM STATE CHO MODAL
  const [isMessagesModalVisible, setMessagesModalVisible] = useState(false); // Modal cho lời chúc
  const insets = useSafeAreaInsets();

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
          <TouchableOpacity
            onPress={() => navigation.navigate("Main", { screen: "Home" })}
          >
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
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(100) + insets.bottom
                : responsiveHeight(16),
          },
        ]}
      >
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#2ecc71" }]}
            onPress={() => setModalVisible(true)} // --- SỬA DÒNG NÀY ---
          >
            <QrCode color="#fff" size={responsiveWidth(24)} />
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
            <Globe color="#fff" size={responsiveWidth(24)} />
            <Text style={styles.gridButtonText}>MỞ WEBSITE</Text>
            <Text style={styles.gridButtonSubText}>Xem website của bạn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#e74c3c" }]}
          >
            <Users color="#fff" size={responsiveWidth(24)} />
            <Text style={styles.gridButtonText}>KHÁCH MỜI</Text>
            <Text style={styles.gridButtonSubText}>
              Tất cả khách mời: {invitation.guestRsvpCount || 0}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.gridButton, { backgroundColor: "#95a5a6" }]}
            onPress={() => setMessagesModalVisible(true)}
          >
            <MessageSquareText color="#fff" size={responsiveWidth(24)} />
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
                <item.icon
                  size={responsiveWidth(22)}
                  color={!item.action ? "#ccc" : "#555"}
                />
                <Text
                  style={[
                    styles.menuItemText,
                    !item.action && { color: "#ccc" },
                  ]}
                >
                  {item.label}
                </Text>
              </View>
              {item.isPremium && (
                <Crown size={responsiveWidth(20)} color="#f1c40f" />
              )}
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
              <X size={responsiveWidth(24)} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Mã QR Website</Text>

            <View
              style={{
                padding: responsiveWidth(10),
                backgroundColor: "white",
                borderRadius: responsiveWidth(8),
                marginBottom: responsiveHeight(20),
              }}
            >
              <QRCode value={websiteUrl} size={responsiveWidth(220)} />
            </View>

            <Text
              style={{
                fontSize: responsiveFont(14),
                color: "#555",
                marginBottom: responsiveHeight(10),
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
                <Copy size={responsiveWidth(22)} color="#e07181" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Lời Chúc */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isMessagesModalVisible}
        onRequestClose={() => setMessagesModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalView, { maxHeight: "80%" }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setMessagesModalVisible(false)}
            >
              <X size={responsiveWidth(24)} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Lời Chúc Từ Khách Mời</Text>

            {!invitation.guestbookMessages ||
            invitation.guestbookMessages.length === 0 ? (
              <Text
                style={{
                  fontSize: responsiveFont(14),
                  color: "#999",
                  textAlign: "center",
                  marginTop: responsiveHeight(20),
                  fontFamily: "Montserrat-Medium",
                }}
              >
                Chưa có lời chúc nào
              </Text>
            ) : (
              <ScrollView style={{ width: "100%", maxHeight: "100%" }}>
                {invitation.guestbookMessages.map(
                  (message: any, index: number) => (
                    <View key={index} style={styles.messageCard}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageName}>
                          {message.name || "Khách mời"}
                        </Text>
                        <Text style={styles.messageDate}>
                          {new Date(message.createdAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </Text>
                      </View>
                      <Text style={styles.messageContent}>
                        {message.message}
                      </Text>
                    </View>
                  )
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },
  header: {
    backgroundColor: "#fbe2e7",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#f0d4d9",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(18),
    fontWeight: "600",
    color: "#e07181",
  },
  container: {
    padding: responsiveWidth(16),
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridButton: {
    width: "48%",
    height: responsiveHeight(100),
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    justifyContent: "space-between",
    marginBottom: responsiveHeight(16),
  },
  gridButtonText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#fff",
    fontSize: responsiveFont(14),
    fontWeight: "bold",
  },
  gridButtonSubText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#fff",
    fontSize: responsiveFont(12),
  },
  menuList: {
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(12),
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: responsiveWidth(16),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(16),
    marginLeft: responsiveWidth(16),
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
    margin: responsiveWidth(20),
    backgroundColor: "white",
    borderRadius: responsiveWidth(20),
    padding: responsiveWidth(25),
    paddingTop: responsiveHeight(40),
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
    top: responsiveHeight(15),
    right: responsiveWidth(15),
  },
  modalTitle: {
    marginBottom: responsiveHeight(20),
    textAlign: "center",
    fontSize: responsiveFont(20),
    fontFamily: "Montserrat-SemiBold",
    color: "#e07181",
  },
  modalLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: responsiveWidth(8),
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(15),
    width: "100%",
  },
  modalLinkText: {
    flex: 1,
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-Medium",
    color: "#333",
    marginRight: responsiveWidth(10),
  },
  messageCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    borderLeftWidth: 4,
    borderLeftColor: "#e07181",
  },
  messageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(8),
  },
  messageName: {
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-SemiBold",
    color: "#e07181",
  },
  messageDate: {
    fontSize: responsiveFont(12),
    fontFamily: "Montserrat-Medium",
    color: "#999",
  },
  messageContent: {
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-Medium",
    color: "#333",
    lineHeight: responsiveFont(20),
  },
});
