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

// ----- BƯỚC 1: SỬA LẠI IMPORT -----
import { useAppDispatch, useAppSelector } from "../store/hooks"; // Dùng hook đã được type
import { selectCurrentUser, logout } from "../store/authSlice";
import { persistor } from "../store/store"; // <-- Import persistor từ file store
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { StackNavigationProp } from "@react-navigation/stack";
import { getMyFeedback } from "src/service/feedbackService";
import FeedbackModal from "./FeedbackModal";
import { resetFeedback } from "src/store/feedbackSlice";
import { MixpanelService } from "../service/mixpanelService";
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
        <IconComponent color={COLORS.iconColor} size={20} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemLabel}>{label}</Text>
        {value && <Text style={styles.itemValue}>{value}</Text>}
      </View>
      {onPress && <ChevronRight color={COLORS.textSecondary} size={22} />}
    </TouchableOpacity>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  // ----- BƯỚC 2: SỬ DỤNG HOOK ĐÃ TYPE -----
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  // ----------------------------------------

  // ----- BƯỚC 3: CẬP NHẬT HÀM LOGOUT -----
  const handleLogout = async () => {
    // Xóa state trong bộ nhớ Redux
    MixpanelService.track("User Logged Out");
    MixpanelService.reset();
    dispatch(logout());
    dispatch(resetFeedback());
    // Yêu cầu redux-persist xóa state đã lưu trong AsyncStorage
    await persistor.purge();

    // Điều hướng về trang Login
    // Dùng reset để đảm bảo người dùng không thể back lại màn hình Profile
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
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
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarSection}>
          <Image
            source={{ uri: user.picture || "https://i.pravatar.cc/300" }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editButton}>
            <Pencil size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <ProfileItem
            icon={CreditCard}
            label="Nâng cấp tài khoản"
            onPress={() => navigation.navigate("UpgradeAccountScreen")} // <-- Đảm bảo tên route này khớp với AppNavigator
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
            label="Mật khẩu"
            value="••••••••"
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Thay đổi Mật khẩu",
                currentValue: "",
                field: "password",
              })
            }
          />
          <View style={styles.separator} />
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
          </View>
        </View>

        <View style={styles.card}>
          <ProfileItem
            icon={Globe}
            label="Ngôn ngữ"
            value="Việt Nam"
            onPress={() => console.log("Chỉnh sửa ngôn ngữ")}
          />
          <View style={styles.separator} />
          <ProfileItem
            icon={Cake}
            label="Ngày sinh"
            value="01/01/2000"
            onPress={() =>
              navigation.navigate("EditProfileScreen", {
                label: "Chỉnh sửa Ngày sinh",
                currentValue: "01/01/2000",
                field: "birthDate",
              })
            }
          />
        </View>

        {/* Feedback */}
        <View style={styles.card}>
          <ProfileItem
            icon={Mail}
            label="Phản hồi"
            onPress={() => setIsFeedbackModalVisible(true)}
          />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
      <FeedbackModal
        visible={isFeedbackModalVisible}
        onDismiss={() => setIsFeedbackModalVisible(false)}
        existingFeedback={feedback}
      />
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
    paddingTop: 20,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  avatarSection: {
    alignItems: "center",
    marginVertical: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editButton: {
    position: "absolute",
    bottom: 5,
    right: "32%",
    backgroundColor: COLORS.iconColor,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  itemLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  itemValue: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  logoutButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 24,
  },
  logoutButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: COLORS.iconColor,
    fontWeight: "bold",
  },
});

export default ProfileScreen;
