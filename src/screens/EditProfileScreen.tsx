import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials, selectCurrentToken, logout } from "../store/authSlice";
import type { RootStackParamList } from "../navigation/AppNavigator";
import type { StackNavigationProp } from "@react-navigation/stack";
import apiClient from "../api/client";

const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#1F2024",
  textSecondary: "#6D6D6D",
  primary: "#F2C4CE",
  iconColor: "#D8707E",
  white: "#FFFFFF",
};

const EditProfileScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);
  const [isLoading, setIsLoading] = useState(false);

  // Lấy params từ route
  const { label, currentValue, field } =
    route.params as RootStackParamList["EditProfileScreen"];

  // State cho việc chỉnh sửa thông tin chung (fullName, email, etc.)
  const [value, setValue] = useState(currentValue);

  // State mới cho việc đổi mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // === HÀM XỬ LÝ LƯU THÔNG TIN CHUNG ===
  const handleSaveInfo = async () => {
    if (field === "email") {
      if (isLoading || !value) {
        Alert.alert("Lỗi", "Vui lòng nhập email mới.");
        return;
      }
      setIsLoading(true);
      try {
        await apiClient.post("/auth/change-email/request", {
          newEmail: value,
        });
        Alert.alert("Thành công", "Mã OTP đã được gửi đến email mới của bạn.");
        navigation.navigate("OTP", { newEmail: value, from: "change-email" }); // Truyền email mới qua OTPScreen
      } catch (error) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        Alert.alert("Lỗi", errorMessage || "Không thể gửi OTP.");
      } finally {
        setIsLoading(false);
      }
      return; // Dừng hàm ở đây
    }
    if (isLoading || !value) {
      Alert.alert("Lỗi", "Vui lòng không để trống thông tin.");
      return;
    }
    setIsLoading(true);

    try {
      const body = { [field]: value };
      const response = await apiClient.put("/auth/profile", body);

      // Dispatch để cập nhật toàn bộ thông tin user trong Redux
      dispatch(setCredentials({ user: response.data, token }));

      Alert.alert("Thành công", `Đã cập nhật "${label}" của bạn.`);
      navigation.goBack();
    } catch (error) {
      console.error("Update Info Error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      Alert.alert("Lỗi", errorMessage || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setIsLoading(false);
    }
  };

  // === HÀM MỚI ĐỂ XỬ LÝ LƯU MẬT KHẨU ===
  const handleChangePassword = async () => {
    // Client-side validation
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("Lỗi", "Mật khẩu mới không khớp. Vui lòng kiểm tra lại.");
      return;
    }

    setIsLoading(true);
    try {
      const body = { oldPassword, newPassword, confirmNewPassword };
      const response = await apiClient.put("/auth/profile", body);

      Alert.alert(
        "Đổi mật khẩu thành công", // Title
        "Để tăng cường bảo mật, bạn có muốn đăng xuất khỏi tất cả thiết bị không?", // Message
        [
          // Mảng các nút
          {
            text: "Không",
            onPress: () => navigation.goBack(), // Nếu không, chỉ cần quay lại
            style: "cancel",
          },
          {
            text: "Có, Đăng xuất",
            onPress: () => {
              dispatch(logout()); // Gọi action logout
              // Reset navigation stack về màn hình Login
              navigation.reset({
                index: 0,
                routes: [{ name: "Login" }],
              });
            },
            style: "destructive", // (iOS) Hiển thị chữ màu đỏ để nhấn mạnh
          },
        ],
        { cancelable: false } // (Android) Không cho phép tắt pop-up bằng cách nhấn ra ngoài
      );
    } catch (error) {
      console.error("Change Password Error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      Alert.alert("Lỗi", errorMessage || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // === RENDER GIAO DIỆN CHUNG ===
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <ArrowLeft size={24} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{label}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  // === RENDER GIAO DIỆN ĐỔI MẬT KHẨU ===
  const renderChangePasswordForm = () => (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>Mật khẩu cũ</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu hiện tại"
        secureTextEntry
        value={oldPassword}
        onChangeText={setOldPassword}
        autoCapitalize="none"
        autoFocus={true}
      />

      <Text style={[styles.inputLabel, { marginTop: 20 }]}>Mật khẩu mới</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
        autoCapitalize="none"
      />

      <Text style={[styles.inputLabel, { marginTop: 20 }]}>
        Xác nhận mật khẩu mới
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập lại mật khẩu mới"
        secureTextEntry
        value={confirmNewPassword}
        onChangeText={setConfirmNewPassword}
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleChangePassword}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.saveButtonText}>Lưu mật khẩu mới</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // === RENDER GIAO DIỆN CHỈNH SỬA THÔNG TIN CHUNG ===
  const renderEditInfoForm = () => (
    <View style={styles.container}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        autoCapitalize="none"
        autoFocus={true}
        keyboardType={field === "email" ? "email-address" : "default"}
      />
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSaveInfo}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {renderHeader()}
      <ScrollView>
        {/* Điều kiện để render form phù hợp */}
        {field === "password"
          ? renderChangePasswordForm()
          : renderEditInfoForm()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    marginTop: StatusBar.currentHeight || 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20, // Adjusted for SafeAreaView
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  container: {
    padding: 20,
  },
  inputLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    fontFamily: "Montserrat-Medium",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  saveButton: {
    backgroundColor: COLORS.iconColor,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  saveButtonDisabled: {
    backgroundColor: "#FAD1D8",
  },
});

export default EditProfileScreen;
