import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "../../api/client";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import type { RootStackParamList } from "../../navigation/types";
import logger from "../../utils/logger";

const COLORS = {
  bg: "#fedef0",
  primary: "#ff5a7a",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  card: "#ffffff",
} as const;

const isValidEmail = (email: string) => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};

export default function RegistrationScreen() {
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleRegister = async () => {
    // 1. Kiểm tra dữ liệu đầu vào (giữ nguyên)
    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert("Thông tin không hợp lệ", "Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(
        "Email không hợp lệ",
        "Vui lòng nhập một địa chỉ email hợp lệ."
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert("Mật khẩu yếu", "Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Xác nhận thất bại", "Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      // 2. Gọi API đăng ký (giữ nguyên)
      type RegisterResponse = {
        token: string;
        user: any;
      };
      const response = await apiClient.post<RegisterResponse>(
        "/auth/register",
        {
          fullName: username,
          email,
          password,
        }
      );

      // BƯỚC 2: Nếu thành công, chuyển đến màn hình OTP
      Alert.alert("Thành công", `Mã xác thực đã được gửi đến ${email}.`);
      navigation.navigate("OTP", { email, from: "register" }); // Thêm 'from' để OTPScreen biết đây là luồng đăng ký
    } catch (error) {
      logger.error("Registration error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      Alert.alert("Đăng ký thất bại", errorMessage || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.bg}
        translucent={false}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Đăng ký</Text>
              
            </View>

            <View style={styles.card}>
              {/* Registration Form */}
              <View style={styles.form}>
                {/* Username Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Tên</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập tên của bạn"
                    placeholderTextColor="#9ca3af"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="words"
                  />
                </View>

                {/* Email Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email của bạn"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Nhập mật khẩu của bạn"
                      placeholderTextColor="#9ca3af"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={10}
                    >
                      {showPassword ? (
                        <EyeOff size={22} color="#6b7280" />
                      ) : (
                        <Eye size={22} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password Field */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Xác nhận mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      placeholder="Nhập lại mật khẩu"
                      placeholderTextColor="#9ca3af"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      hitSlop={10}
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={22} color="#6b7280" />
                      ) : (
                        <Eye size={22} color="#6b7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Đăng ký</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Link */}
            <View style={styles.loginLinkContainer}>
              <Text style={styles.loginText}>Đã có tài khoản? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Đăng nhập</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingTop: 28,
    backgroundColor: COLORS.bg,
  },
  page: { flex: 1, justifyContent: "center" },
  header: {
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "MavenPro",
    fontWeight: "800",
    fontSize: 44,
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: "rgb(179, 119, 134)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0,
    borderColor: "rgba(255, 90, 122, 0.16)",
  },
  form: {
    gap: 12,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  input: {
    fontFamily: "Montserrat-Medium",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    fontFamily: "Montserrat-Medium",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 60,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 13,
    padding: 4,
  },
  primaryButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
  },
  // Style mới cho đường kẻ và chữ "hoặc"
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d1d5db",
  },
  dividerText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#9ca3af",
    marginHorizontal: 16, // Thêm khoảng cách hai bên chữ
  },
  guestButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  guestButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  loginLinkContainer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.muted,
  },
  loginLink: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },

  // removed: divider + guest login styles
});
