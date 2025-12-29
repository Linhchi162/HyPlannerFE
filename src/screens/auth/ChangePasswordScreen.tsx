import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Eye, EyeOff, Check, Shield } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/core";
import { useRoute, RouteProp } from "@react-navigation/native";
import apiClient from "../../api/client";

type ChangePasswordRouteProp = RouteProp<RootStackParamList, "ChangePassword">;

export default function ChangePasswordScreen() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const [isLoading, setIsLoading] = useState(false); // Thêm loading state
  const route = useRoute<ChangePasswordRouteProp>();

  const { email, token } = route.params;

  const handleResetPassword = async () => {
    if (!isFormValid) return;

    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        email,
        token,
        password: newPassword, // newPassword từ state
      });
      navigation.navigate("PasswordUpdated");
    } catch (error) {
      Alert.alert(
        "Lỗi",
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Không thể đặt lại mật khẩu. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Password validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    newPassword === confirmPassword;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Đổi mật khẩu</Text>
          </View>

          <View style={styles.form}>
            {/* New Password Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Mật khẩu mới</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              <View style={styles.requirements}>
                <View style={styles.requirement}>
                  <View
                    style={[
                      styles.checkIcon,
                      hasMinLength && styles.checkIconActive,
                    ]}
                  >
                    <Check size={12} color="white" />
                  </View>
                  <Text style={styles.requirementText}>Ít nhất 8 kí tự</Text>
                </View>

                <View style={styles.requirement}>
                  <View
                    style={[
                      styles.checkIcon,
                      hasUppercase && styles.checkIconActive,
                    ]}
                  >
                    <Check size={12} color="white" />
                  </View>
                  <Text style={styles.requirementText}>Một kí tự in hoa</Text>
                </View>

                <View style={styles.requirement}>
                  <View
                    style={[
                      styles.checkIcon,
                      hasNumber && styles.checkIconActive,
                    ]}
                  >
                    <Check size={12} color="white" />
                  </View>
                  <Text style={styles.requirementText}>Một chữ số</Text>
                </View>
              </View>
            </View>

            {/* Confirm Password Section */}
            <View style={styles.section}>
              <Text style={styles.label}>Nhập lại mật khẩu</Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập lại mật khẩu"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#9ca3af" />
                  ) : (
                    <Eye size={20} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                isFormValid && !isLoading && styles.saveButtonActive,
                isLoading && { opacity: 0.6 },
              ]}
              disabled={!isFormValid || isLoading}
              onPress={handleResetPassword} // Gọi hàm mới
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu mật khẩu</Text>
              )}
            </TouchableOpacity>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoContent}>
                <View style={styles.shieldIcon}>
                  <Shield size={14} color="white" />
                </View>
                <View style={styles.infoTextContainer}>
                  <Text style={styles.infoTitle}>Mẹo :</Text>
                  <Text style={styles.infoText}>
                    Hãy chọn một mật khẩu mạnh mà bạn chưa từng sử dụng ở nơi
                    khác. Hãy cân nhắc sử dụng trình quản lý mật khẩu để tạo và
                    lưu trữ các mật khẩu an toàn.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 24,
    fontWeight: "600",
    color: "#e56e8a",
  },
  form: {
    maxWidth: 400,
    alignSelf: "center",
    width: "100%",
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 16,
  },
  inputContainer: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    paddingRight: 48,
    fontSize: 16,
    color: "#374151",
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 12,
    padding: 4,
  },
  requirements: {
    gap: 8,
  },
  requirement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  checkIconActive: {
    backgroundColor: "#9ca3af",
  },
  requirementText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  saveButton: {
    backgroundColor: "#adaebc",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  saveButtonActive: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#fef0f3",
    borderWidth: 1,
    borderColor: "#ffb5c6",
    borderRadius: 8,
    padding: 16,
  },
  infoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  shieldIcon: {
    width: 24,
    height: 24,
    backgroundColor: "#e56e8a",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});

