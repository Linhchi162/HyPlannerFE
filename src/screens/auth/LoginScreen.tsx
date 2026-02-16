import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../navigation/types";
import apiClient from "../../api/client";
import { Eye, EyeOff } from "lucide-react-native";
import Checkbox from "expo-checkbox";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { MixpanelService } from "../../service/mixpanelService";
import { registerForPushNotificationsAsync } from "../../utils/pushNotification";
import logger from "../../utils/logger";
import { responsiveHeight } from "../../../assets/styles/utils/responsive";

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

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleEmailLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Thông tin không hợp lệ",
        "Vui lòng nhập đầy đủ email và mật khẩu."
      );
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert(
        "Email không hợp lệ",
        "Vui lòng nhập một địa chỉ email hợp lệ."
      );
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, user } = response.data;

      // Lưu token vào AsyncStorage
      await AsyncStorage.setItem("appToken", token);

      // Lưu preference ghi nhớ đăng nhập
      await AsyncStorage.setItem("rememberMe", JSON.stringify(rememberMe));

      dispatch(setCredentials({ user, token, rememberMe }));

      // Register and send push token to backend
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await apiClient.post("/auth/push-token", { pushToken });
        }
      } catch (error) {
        logger.error("Failed to register push token:", error);
      }

      const userId = user.id || user._id;
      MixpanelService.identify(userId);
      MixpanelService.setUser({ fullName: user.fullName, email: user.email });
      MixpanelService.track("Logged In", {
        Method: "Email",
        RememberMe: rememberMe,
      });

      const role = `${user?.role || user?.userType || ""}`.toUpperCase();
      const isVendor = user?.isVendor === true || role === "VENDOR";
      navigation.reset({
        index: 0,
        routes: [{ name: isVendor ? "VendorMain" : "InviteOrCreate" }],
      });
    } catch (error) {
      const message = "Đã có lỗi xảy ra.";
      Alert.alert("Đăng nhập thất bại", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.page}>
            <View>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Đăng nhập</Text>
              </View>

              <View style={styles.card}>
                {/* Form Inputs */}
                <View style={styles.form}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập email của bạn"
                    placeholderTextColor="#9ca3af"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />

                  <Text style={styles.label}>Mật khẩu</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.inputPassword}
                      placeholder="Nhập mật khẩu của bạn"
                      placeholderTextColor="#9ca3af"
                      secureTextEntry={!isPasswordVisible}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                      hitSlop={10}
                    >
                      {isPasswordVisible ? (
                        <EyeOff color="#6b7280" size={22} />
                      ) : (
                        <Eye color="#6b7280" size={22} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Options */}
                <View style={styles.optionsContainer}>
                  <View style={styles.checkboxContainer}>
                    <Checkbox
                      style={styles.checkbox}
                      value={rememberMe}
                      onValueChange={setRememberMe}
                      color={rememberMe ? COLORS.primary : undefined}
                    />
                    <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.forgotPasswordRow}
                    onPress={() => navigation.navigate("ForgotPassword")}
                  >
                    <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Đăng nhập</Text>
                  )}
                </TouchableOpacity>

                {/* Quick register link (always visible) */}
                <View style={styles.inlineLinkRow}>
                  <Text style={styles.inlineLinkText}>Chưa có tài khoản? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("Register")}
                  >
                    <Text style={styles.inlineLinkTextStrong}>Đăng ký</Text>
                  </TouchableOpacity>
                </View>

                {/* Separator */}
                <View style={{ height: responsiveHeight(6) }} />
              </View>
            </View>

            {/* Footer (always inside screen / scrollable) */}
            <View style={styles.footer}>
              <TouchableOpacity
                onPress={() => navigation.navigate("VendorAuth")}
              >
                <Text style={styles.vendorLoginText}>
                  Bạn là nhà cung cấp? Đăng nhập/đăng ký tại đây
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    backgroundColor: COLORS.bg,
  },
  page: {
    flex: 1,
    justifyContent: "space-between",
  },

  header: {
    marginBottom: 14,
    alignItems: "center",
  },
  title: {
    fontFamily: "MavenPro",
    fontWeight: "800",
    fontSize: 44,
    color: COLORS.primary,
    marginBottom: 6,
    marginTop: responsiveHeight(55),
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    borderWidth: 0,
    marginTop: responsiveHeight(10),
  
  },
  form: {
    gap: 16,
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 4,
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
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingRight: 16,
    backgroundColor: COLORS.card,
  },
  inputPassword: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: COLORS.text,
    paddingHorizontal: 16,
  },

  optionsContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginTop: 16,
    marginBottom: 14,
    gap: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    borderRadius: 4,
    width: 20,
    height: 20,
    borderColor: "#D1D5DB",
  },
  checkboxLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  forgotPassword: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
  },
  forgotPasswordRow: {
    alignSelf: "flex-start",
    marginLeft: 5,
  },

  primaryButton: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  primaryButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  inlineLinkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  inlineLinkText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.muted,
  },
  inlineLinkTextStrong: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "700",
  },

  footer: {
    alignItems: "center",
    paddingTop: 14,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  signupText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: COLORS.muted,
  },
  signupLink: {
    fontFamily: "Montserrat-Medium",
    color: COLORS.primary,
    fontWeight: "600",
  },
  vendorLoginText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 18,
    marginBottom: 100,
  },
});

export default LoginScreen;
