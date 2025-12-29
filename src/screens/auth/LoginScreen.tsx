import React, { useCallback, useState, useEffect } from "react";
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../navigation/types";
import apiClient from "../../api/client";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import { Eye, EyeOff } from "lucide-react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";
import { useDispatch } from "react-redux";
import { setCredentials } from "../../store/authSlice";
import { MixpanelService } from "../../service/mixpanelService";
import { registerForPushNotificationsAsync } from "../../utils/pushNotification";
import logger from "../../utils/logger";

WebBrowser.maybeCompleteAuthSession();

const getTwoThirds = (value: number) => Math.round(value * 0.66);

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

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!backendUrl) throw new Error("EXPO_PUBLIC_BASE_URL is not defined.");
      const authUrl = `${backendUrl}/auth/google`;
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        process.env.EXPO_PUBLIC_SCHEME
      );

      if (result.type === "success") {
        const { url } = result;
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token");

        if (token) {
          await AsyncStorage.setItem("appToken", token);
          await AsyncStorage.setItem("rememberMe", JSON.stringify(true));
          const response = await apiClient.get("/auth/me");
          const user = response.data;

          dispatch(setCredentials({ user, token, rememberMe: true }));

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
          MixpanelService.setUser({
            fullName: user.fullName,
            email: user.email,
          });
          MixpanelService.track("Logged In", {
            Method: "Google",
            RememberMe: true,
          });

          // SỬA LẠI NAVIGATION: Không truyền params
          navigation.reset({
            index: 0,
            routes: [{ name: "InviteOrCreate" }],
          });
        } else {
          Alert.alert("Lỗi", "Không tìm thấy token trong URL trả về.");
        }
      }
    } catch (error) {
      logger.error("Error during Google sign-in:", error);
      Alert.alert("Lỗi", "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [navigation, dispatch]);

  const handleFacebookLogin = async () => {
    setLoading(true);
    try {
      const loginResult = await LoginManager.logInWithPermissions([
        "public_profile",
        "email",
      ]);
      if (loginResult.isCancelled) {
        setLoading(false);
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        throw new Error("Không thể lấy được token truy cập Facebook.");
      }
      const facebookAccessToken = data.accessToken;
      const response = await apiClient.post("/auth/facebook/token", {
        access_token: facebookAccessToken,
      });
      const { token, user: originalUser } = response.data as {
        token: string;
        user: { name: string; id: string; email: string; [key: string]: any };
      };
      const { name, ...restOfUser } = originalUser;
      const updatedUser = {
        ...restOfUser,
        fullName: name || originalUser.email,
      };

      await AsyncStorage.setItem("appToken", token);
      await AsyncStorage.setItem("rememberMe", JSON.stringify(true));

      dispatch(setCredentials({ user: updatedUser, token, rememberMe: true }));

      // Register and send push token to backend
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await apiClient.post("/auth/push-token", { pushToken });
        }
      } catch (error) {
        logger.error("Failed to register push token:", error);
      }

      MixpanelService.identify(updatedUser.id);
      MixpanelService.setUser({
        fullName: updatedUser.fullName,
        email: updatedUser.email,
      });
      MixpanelService.track("Logged In", {
        Method: "Facebook",
        RememberMe: true,
      });

      // SỬA LẠI NAVIGATION: Không truyền params
      navigation.reset({
        index: 0,
        routes: [{ name: "InviteOrCreate" }],
      });
    } catch (error) {
      logger.error("Error during Facebook login:", error);
      Alert.alert("Lỗi", `Đăng nhập Facebook thất bại.`);
    } finally {
      setLoading(false);
    }
  };

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

      navigation.reset({
        index: 0,
        routes: [{ name: "InviteOrCreate" }],
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
        backgroundColor="#FFFFFF"
        translucent={false}
      />
      <View
        style={[
          styles.container,
          {
            paddingBottom: Platform.OS === "android" ? 40 + insets.bottom : 40,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>
            Chào mừng bạn quay trở lại! Vui lòng đăng nhập để tiếp tục.
          </Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Nhập email của bạn"
            placeholderTextColor="#BDBDBD"
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
              placeholderTextColor="#BDBDBD"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? (
                <EyeOff color="#8A8A8A" size={22} />
              ) : (
                <Eye color="#8A8A8A" size={22} />
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
              color={rememberMe ? "#D8707E" : undefined}
            />
            <Text style={styles.checkboxLabel}>Ghi nhớ đăng nhập</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleEmailLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#D8707E" />
          ) : (
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        {/* Separator */}
        <View style={styles.separatorContainer}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>hoặc</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Social Logins */}
        <View style={styles.socialLoginContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            <AntDesign name="google" size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleFacebookLogin}
            disabled={loading}
          >
            <FontAwesome name="facebook-f" size={24} color="#2D2D2D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() =>
              Alert.alert("Thông báo", "Chức năng đang phát triển")
            }
            disabled={loading}
          >
            <FontAwesome name="user" size={24} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        {/* Sign Up */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={[styles.signupText, styles.signupLink]}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: "#F8F9FA",
  },

  header: {
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 48,
    color: "#e56e8a",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },

  form: {
    marginBottom: 18,
    gap: 16,
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 4,
  },
  input: {
    fontFamily: "Montserrat-Medium",
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1F2937",
    backgroundColor: "#FFFFFF",
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingRight: 16,
    backgroundColor: "#FFFFFF",
  },
  inputPassword: {
    flex: 1,
    fontFamily: "Montserrat-Medium",
    fontSize: 16,
    color: "#1F2937",
    paddingHorizontal: 16,
  },

  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
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
    color: "#e56e8a",
    fontWeight: "600",
  },

  loginButton: {
    height: 50,
    backgroundColor: "#e56e8a",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  loginButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  separatorText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#9CA3AF",
    marginHorizontal: 16,
  },

  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 40,
    paddingHorizontal: 40,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingBottom: 20,
  },
  signupText: {
    fontFamily: "Montserrat-Medium",
    fontSize: 14,
    color: "#6B7280",
  },
  signupLink: {
    fontFamily: "Montserrat-Medium",
    color: "#e56e8a",
    fontWeight: "600",
  },
});

export default LoginScreen;
