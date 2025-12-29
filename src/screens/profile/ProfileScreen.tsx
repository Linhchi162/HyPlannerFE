import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  ChevronRight,
  User,
  Mail,
  Lock,
  Moon,
  Globe,
  Cake,
  Pencil,
  CreditCard,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ----- BƯỚC 1: SỬA LẠI IMPORT -----
import { useAppDispatch, useAppSelector } from "../../store/hooks"; // Dùng hook đã được type
import {
  selectCurrentUser,
  logout,
  updateUserField,
} from "../../store/authSlice";
import { persistor } from "../../store/store"; // <-- Import persistor từ file store
import type { RootStackParamList } from "../../navigation/types";
import type { StackNavigationProp } from "@react-navigation/stack";
import { getMyFeedback } from "../../service/feedbackService";
import FeedbackModal from "../shared/FeedbackModal";
import apiClient from "../../api/client";
import { resetFeedback } from "../../store/feedbackSlice";
import { MixpanelService } from "../../service/mixpanelService";
import { clearWeddingEvent } from "../../store/weddingEventSlice";
import {
  leaveWeddingEvent,
  deleteWeddingEvent,
} from "../../service/weddingEventService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import logger from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// ------------------------------------

const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#1F2024",
  textSecondary: "#6D6D6D",
  primary: "#F2C4CE",
  iconColor: "#D8707E",
  white: "#FFFFFF",
};

type ProfileItemProps = {
  icon: React.ComponentType<{ color: string; size: number }>;
  label: string;
  value?: string;
  onPress?: () => void;
};

const ProfileItem: React.FC<ProfileItemProps> = ({
  icon,
  label,
  value,
  onPress,
}) => {
  const IconComponent = icon;
  return (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: COLORS.primary }]}>
        <IconComponent color={COLORS.iconColor} size={responsiveWidth(20)} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemLabel}>{label}</Text>
        {value && <Text style={styles.itemValue}>{value}</Text>}
      </View>
      {onPress && (
        <ChevronRight color={COLORS.textSecondary} size={responsiveWidth(22)} />
      )}
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showLeaveEventDialog, setShowLeaveEventDialog] = useState(false);
  const insets = useSafeAreaInsets();
  // ----- BƯỚC 2: SỬ DỤNG HOOK ĐÃ TYPE -----
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const weddingEvent = useAppSelector(
    (state) => state.weddingEvent.getWeddingEvent.weddingEvent
  );
  // ----------------------------------------

  // Hàm chọn và upload avatar
  const handleChangeAvatar = async () => {
    try {
      // Yêu cầu quyền truy cập thư viện ảnh
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Bạn cần cho phép truy cập thư viện ảnh để thay đổi avatar."
        );
        return;
      }

      // Mở thư viện ảnh
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;

        setUploadingAvatar(true);

        // Tạo FormData để upload file
        const formData = new FormData();

        // Lấy tên file từ URI
        const filename = imageUri.split("/").pop() || "avatar.jpg";

        // Xác định MIME type
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // Thêm file vào FormData
        formData.append("avatar", {
          uri: imageUri,
          name: filename,
          type: type,
        } as any);

        // Gọi API upload với FormData
        const response = await apiClient.post("/upload/avatar", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        // Lấy URL từ Cloudinary
        const cloudinaryUrl = response.data.avatarUrl;

        // Cập nhật Redux state để đồng bộ avatar trong toàn app
        dispatch(updateUserField({ field: "picture", value: cloudinaryUrl }));

        MixpanelService.track("Updated Avatar", {
          uploadMethod: "Cloudinary",
        });

        Alert.alert("Thành công", "Cập nhật avatar thành công!");
        setUploadingAvatar(false);
      }
    } catch (error: any) {
      logger.error("Error updating avatar:", error);
      const errorMessage =
        error?.message || "Không thể cập nhật avatar. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
      setUploadingAvatar(false);
    }
  }; // ----- BƯỚC 3: CẬP NHẬT HÀM LOGOUT -----
  const handleLogout = async () => {
    // Xóa state trong bộ nhớ Redux
    MixpanelService.track("User Logged Out");
    MixpanelService.reset();
    dispatch(logout());
    dispatch(resetFeedback());

    // Xóa token và rememberMe preference
    await AsyncStorage.removeItem("appToken");
    await AsyncStorage.removeItem("rememberMe");

    // Yêu cầu redux-persist xóa state đã lưu trong AsyncStorage
    await persistor.purge();

    // Điều hướng về trang Login
    // Dùng reset để đảm bảo người dùng không thể back lại màn hình Profile
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  // ----- XỬ LÝ RỜI KHỎI KẾ HOẠCH CƯỚI -----
  const handleLeaveWeddingEvent = async () => {
    try {
      setShowLeaveEventDialog(false);

      const eventId = weddingEvent?._id;
      const userId = user?.id || user?._id;

      if (!eventId || !userId) {
        Alert.alert("Lỗi", "Không tìm thấy thông tin sự kiện hoặc người dùng.");
        return;
      }

      // Kiểm tra nếu user là creator
      if (weddingEvent.creatorId === userId) {
        // Creator -> Xóa toàn bộ sự kiện
        Alert.alert(
          "Xác nhận xóa kế hoạch cưới",
          "Bạn là người tạo sự kiện. Nếu rời khỏi, toàn bộ kế hoạch cưới sẽ bị xóa và tất cả thành viên sẽ bị loại khỏi kế hoạch này. Bạn có chắc chắn muốn tiếp tục?",
          [
            {
              text: "Hủy",
              style: "cancel",
            },
            {
              text: "Xóa kế hoạch cưới",
              style: "destructive",
              onPress: async () => {
                try {
                  // Track sự kiện trong Mixpanel
                  MixpanelService.track("Deleted Wedding Event");

                  // Gọi API để xóa wedding event và tất cả dữ liệu liên quan
                  await deleteWeddingEvent(eventId, dispatch);

                  // Xóa thông tin wedding event trong Redux
                  dispatch(clearWeddingEvent());

                  // Xóa toàn bộ cache redux-persist và lưu lại state mới
                  await persistor.purge();
                  await persistor.flush();

                  Alert.alert(
                    "Thành công",
                    "Đã xóa kế hoạch cưới và tất cả dữ liệu liên quan."
                  );

                  // Điều hướng về màn hình InviteOrCreateScreen
                  navigation.reset({
                    index: 0,
                    routes: [{ name: "InviteOrCreate" }],
                  });
                } catch (error: any) {
                  logger.error("Error deleting wedding event:", error);
                  const errorMessage =
                    error || "Không thể xóa kế hoạch cưới. Vui lòng thử lại.";
                  Alert.alert("Lỗi", errorMessage);
                }
              },
            },
          ]
        );
        return;
      }

      // Member -> Chỉ rời khỏi sự kiện
      // Track sự kiện trong Mixpanel
      MixpanelService.track("Left Wedding Event");

      // Gọi API để remove user khỏi wedding event trong database
      await leaveWeddingEvent(eventId, userId, dispatch);

      // Xóa thông tin wedding event trong Redux
      dispatch(clearWeddingEvent());

      // Xóa toàn bộ cache redux-persist và lưu lại state mới
      await persistor.purge();
      await persistor.flush();

      // Điều hướng về màn hình InviteOrCreateScreen
      navigation.reset({
        index: 0,
        routes: [{ name: "InviteOrCreate" }],
      });
    } catch (error: any) {
      logger.error("Error leaving wedding event:", error);
      const errorMessage =
        error || "Không thể rời khỏi kế hoạch cưới. Vui lòng thử lại.";
      Alert.alert("Lỗi", errorMessage);
    }
  };
  // ----------------------------------------
  const userId = user?.id || user?._id;

  // -------------------------Lấy feedback từ Redux store------------
  const feedback = useAppSelector(
    (state) => state.feedback.getFeedback.feedback
  );
  // ----- GỌI getMyFeedback KHI COMPONENT MỞ -----
  useEffect(() => {
    MixpanelService.track("Viewed Profile Screen");
    if (userId) {
      getMyFeedback(userId, dispatch);
    }
  }, [userId, dispatch]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy thông tin người dùng.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={{ color: COLORS.iconColor, marginTop: 10 }}>
            Quay lại đăng nhập
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={responsiveWidth(24)} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: responsiveWidth(24) }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(100) + insets.bottom
                : responsiveHeight(32),
          },
        ]}
      >
        <View style={styles.avatarSection}>
          {/* LOGIC HIỂN THỊ AVATAR */}
          {user.picture ? (
            <Image source={{ uri: user.picture }} style={styles.avatar} />
          ) : (
            // Nếu chưa có ảnh -> Hiển thị View mặc định với icon User
            <View style={[styles.avatar, styles.defaultAvatarContainer]}>
              <User size={responsiveWidth(60)} color="#9ca3af" />
            </View>
          )}

          {/* Phần Loading khi upload (Giữ nguyên) */}
          {uploadingAvatar && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color={COLORS.white} />
            </View>
          )}

          {/* Nút chỉnh sửa (Giữ nguyên) */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleChangeAvatar}
            disabled={uploadingAvatar}
          >
            <Pencil size={responsiveWidth(18)} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <ProfileItem
            icon={CreditCard}
            label="Nâng cấp tài khoản"
            onPress={() => navigation.navigate("UpgradeAccountScreen")}
          />
        </View>

        <View style={styles.card}>
          <ProfileItem
            icon={User}
            label="Tên đăng nhập"
            value={user.fullName}
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Chỉnh sửa Tên",
                currentValue: user.fullName,
                field: "fullName",
              })
            }
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Mail}
            label="Email"
            value={user.email}
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Chỉnh sửa Email",
                currentValue: user.email,
                field: "email",
              })
            }
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Lock}
            label="Thay đổi mật khẩu"
            value="••••••••"
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Thay đổi Mật khẩu",
                currentValue: "",
                field: "password",
              })
            }
          />
          {/* <View style={styles.separator} />
          <View style={styles.itemContainer}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: COLORS.primary },
              ]}
            >
              <Moon color={COLORS.iconColor} size={20} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.itemLabel}>Chế độ tối</Text>
            </View>
            <Switch
              trackColor={{ false: "#E9E9EA", true: COLORS.primary }}
              thumbColor={isDarkMode ? COLORS.iconColor : "#f4f3f4"}
              onValueChange={() =>
                setIsDarkMode((previousState) => !previousState)
              }
              value={isDarkMode}
            />
          </View> */}
        </View>

        <View style={styles.card}>
          <ProfileItem
            icon={Globe}
            label="Ngôn ngữ"
            value="Việt Nam"
            onPress={() => logger.log("Chỉnh sửa ngôn ngữ")}
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Cake}
            label="Ngày cưới"
            value={
              user.weddingDate
                ? new Date(user.weddingDate).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Chưa đặt"
            }
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Chỉnh sửa Ngày cưới",
                currentValue: user.weddingDate || new Date().toISOString(),
                field: "weddingDate",
              })
            }
          />
          {/* Only show wedding info edit for creator */}
          {weddingEvent &&
            (user?.id || user?._id) === weddingEvent.creatorId && (
              <>
                <View style={styles.separator} />
                <ProfileItem
                  icon={Pencil}
                  label="Thông tin kế hoạch cưới"
                  value={
                    weddingEvent.brideName && weddingEvent.groomName
                      ? `${weddingEvent.brideName} & ${weddingEvent.groomName}`
                      : "Chưa đặt"
                  }
                  onPress={() =>
                    navigation.navigate("EditWeddingInfo", {
                      eventId: weddingEvent._id,
                    })
                  }
                />
              </>
            )}
        </View>

        {/* Feedback */}
        <View style={styles.card}>
          <ProfileItem
            icon={Mail}
            label="Phản hồi"
            onPress={() => setIsFeedbackModalVisible(true)}
          />
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => setShowLeaveEventDialog(true)}
        >
          <Text style={styles.logoutButtonText}>
            Tham gia với tư cách thành viên gia đình
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
      <FeedbackModal
        visible={isFeedbackModalVisible}
        onDismiss={() => setIsFeedbackModalVisible(false)}
        existingFeedback={feedback}
      />

      {/* Dialog cảnh báo rời khỏi kế hoạch cưới */}
      {showLeaveEventDialog && (
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogContainer}>
            <Text style={styles.dialogTitle}>Cảnh báo</Text>
            <Text style={styles.dialogMessage}>
              {weddingEvent &&
              (user?.id || user?._id) === weddingEvent.creatorId
                ? "Bạn là người tạo sự kiện. Nếu rời khỏi, toàn bộ kế hoạch cưới sẽ bị xóa vĩnh viễn và tất cả thành viên sẽ bị loại khỏi kế hoạch này.\n\nĐể tránh làm mất kế hoạch cưới đã tạo trước đó, bạn nên sử dụng một tài khoản mới khi dùng tính năng này.\n\nHành động này không thể hoàn tác!"
                : "Bạn có chắc chắn muốn rời khỏi kế hoạch cưới hiện tại?\n\nBạn sẽ mất quyền truy cập vào tất cả thông tin và công việc trong kế hoạch này."}
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonCancel]}
                onPress={() => setShowLeaveEventDialog(false)}
              >
                <Text style={styles.dialogButtonTextCancel}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, styles.dialogButtonConfirm]}
                onPress={handleLeaveWeddingEvent}
              >
                <Text style={styles.dialogButtonTextConfirm}>
                  {weddingEvent &&
                  (user?.id || user?._id) === weddingEvent.creatorId
                    ? "Xóa kế hoạch"
                    : "Đồng ý"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Thêm style cho màn hình loading/error
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
    paddingTop: responsiveHeight(20),
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(20),
    color: COLORS.textPrimary,
  },
  scrollContainer: {
    paddingHorizontal: responsiveWidth(16),
    paddingBottom: responsiveHeight(32),
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: responsiveHeight(24),
  },
  avatar: {
    width: responsiveWidth(120),
    height: responsiveWidth(120),
    borderRadius: responsiveWidth(60),
  },
  defaultAvatarContainer: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  uploadingOverlay: {
    position: "absolute",
    width: responsiveWidth(120),
    height: responsiveWidth(120),
    borderRadius: responsiveWidth(60),
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    position: "absolute",
    bottom: responsiveHeight(5),
    right: "35%",
    backgroundColor: COLORS.iconColor,
    width: responsiveWidth(32),
    height: responsiveWidth(32),
    borderRadius: responsiveWidth(16),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: responsiveWidth(16),
    paddingHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(16),
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(16),
  },
  iconContainer: {
    width: responsiveWidth(44),
    height: responsiveWidth(44),
    borderRadius: responsiveWidth(22),
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(16),
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(16),
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  itemValue: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: COLORS.textSecondary,
    marginTop: responsiveHeight(2),
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: responsiveHeight(4),
  },
  leaveEventButton: {
    backgroundColor: "#FFF3CD",
    borderRadius: responsiveWidth(16),
    paddingVertical: responsiveHeight(18),
    alignItems: "center",
    marginTop: responsiveHeight(24),
    borderWidth: 2,
    borderColor: "#FFA500",
  },
  leaveEventButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#D97706",
    fontWeight: "bold",
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: responsiveWidth(16),
    paddingVertical: responsiveHeight(18),
    alignItems: "center",
    marginTop: responsiveHeight(16),
  },
  logoutButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: COLORS.iconColor,
    fontWeight: "bold",
  },
  // Dialog styles
  dialogOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  dialogContainer: {
    backgroundColor: COLORS.white,
    borderRadius: responsiveWidth(20),
    padding: responsiveWidth(24),
    width: "85%",
    maxWidth: responsiveWidth(400),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dialogTitle: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(20),
    color: COLORS.textPrimary,
    marginBottom: responsiveHeight(12),
    textAlign: "center",
  },
  dialogMessage: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(15),
    color: COLORS.textSecondary,
    lineHeight: responsiveHeight(22),
    textAlign: "center",
    marginBottom: responsiveHeight(24),
  },
  dialogActions: {
    flexDirection: "row",
    gap: responsiveWidth(12),
  },
  dialogButton: {
    flex: 1,
    paddingVertical: responsiveHeight(14),
    borderRadius: responsiveWidth(12),
    alignItems: "center",
  },
  dialogButtonCancel: {
    backgroundColor: "#F3F4F6",
  },
  dialogButtonConfirm: {
    backgroundColor: COLORS.iconColor,
  },
  dialogButtonTextCancel: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  dialogButtonTextConfirm: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: COLORS.white,
    fontWeight: "600",
  },
});

export default ProfileScreen;
