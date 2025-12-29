import { useState } from "react";
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
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContainer,
          {
            paddingBottom: Platform.OS === "android" ? 16 + insets.bottom : 16,
          },
        ]}
      >
        <View style={styles.formContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Đăng ký</Text>
            <Text style={styles.subtitle}>
              Cùng nhau tạo nên lễ cưới trong mơ.{"\n"}
              Đăng ký hôm nay - yêu nhau mãi mãi!
            </Text>
          </View>

          {/* Registration Form */}
          <View style={styles.form}>
            {/* Username Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đăng nhập của bạn"
                placeholderTextColor="#9ca3af"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
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
                >
                  {showPassword ? (
                    <EyeOff size={24} color="#9ca3af" />
                  ) : (
                    <Eye size={24} color="#9ca3af" />
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
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor="#9ca3af"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={24} color="#9ca3af" />
                  ) : (
                    <Eye size={24} color="#9ca3af" />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1f2937" />
              ) : (
                <Text style={styles.registerButtonText}>Đăng ký</Text>
              )}
            </TouchableOpacity>

            {/* Cập nhật phần này để tạo hiệu ứng đường kẻ ngang */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>hoặc</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Guest Login Button */}
            <TouchableOpacity style={styles.guestButton}>
              <Text style={styles.guestButtonText}>
                Đăng nhập với chế độ khách
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Đăng Nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  formContainer: {
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 48,
    color: "#e56e8a",
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
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
    color: "#1f2937",
  },
  input: {
    fontFamily: "Montserrat-Medium",
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#6b7280",
    backgroundColor: "#ffffff",
  },
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    fontFamily: "Montserrat-Medium",
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingRight: 60,
    fontSize: 16,
    color: "#6b7280",
    backgroundColor: "#ffffff",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 13,
    padding: 4,
  },
  registerButton: {
    height: 50,
    backgroundColor: "#f9cbd6",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  registerButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 18,
    fontWeight: "500",
    color: "#1f2937",
  },
  // Style mới cho đường kẻ và chữ "hoặc"
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
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
    borderRadius: 8,
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
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#e56e8a",
    fontWeight: "500",
  },
});
