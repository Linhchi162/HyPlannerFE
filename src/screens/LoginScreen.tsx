import React, { useCallback, useState } from "react";
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
} from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../navigation/AppNavigator";
import apiClient from "../api/client";
import { LoginManager, AccessToken } from "react-native-fbsdk-next";
import { Eye, EyeOff } from "lucide-react-native";
import { AntDesign, FontAwesome } from "@expo/vector-icons";
import Checkbox from "expo-checkbox";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // State cho form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // --- LOGIC ĐĂNG NHẬP (Giữ nguyên) ---
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
          const response = await apiClient.get("/auth/me");
          const user = response.data;
          await AsyncStorage.setItem("userData", JSON.stringify(user));
          navigation.replace("Main", {
            screen: "Home",
            params: { token, user },
          });
        } else {
          Alert.alert("Lỗi", "Không tìm thấy token trong URL trả về.");
        }
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      Alert.alert("Lỗi", "Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }, [navigation]);

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
      const { token, user: originalUser } = response.data;
      const { name, ...restOfUser } = originalUser;
      const updatedUser = { ...restOfUser, fullName: name };

      await AsyncStorage.setItem("appToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(updatedUser));
      navigation.replace("Main", {
        screen: "Home",
        params: { token, user: updatedUser },
      });
    } catch (error) {
      console.error("Error during Facebook login:", error);
      Alert.alert("Lỗi", `Đăng nhập Facebook thất bại.`);
    } finally {
      setLoading(false);
    }
  };

  // --- GIAO DIỆN MỚI ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.container}>
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
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => Alert.alert("Thông báo", "Chức năng đang phát triển")}
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
            <AntDesign name="google" size={28} color="#2D2D2D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={handleFacebookLogin}
            disabled={loading}
          >
            <FontAwesome name="facebook-f" size={28} color="#2D2D2D" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() =>
              Alert.alert("Thông báo", "Chức năng đang phát triển")
            }
            disabled={loading}
          >
            <FontAwesome name="user" size={28} color="#2D2D2D" />
          </TouchableOpacity>
        </View>

        {/* Sign Up */}
        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Chưa có tài khoản? </Text>
          <TouchableOpacity
            onPress={() =>
              Alert.alert("Thông báo", "Điều hướng đến trang Đăng ký")
            }
          >
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
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#D8707E",
    fontFamily: "System",
  },
  subtitle: {
    fontSize: 16,
    color: "#8A8A8A",
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
  },
  form: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#2D2D2D",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#FFFFFF",
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputPassword: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  optionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 8,
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#8A8A8A",
  },
  forgotPassword: {
    fontSize: 14,
    color: "#D8707E",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#F2C4CE",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    height: 54,
  },
  loginButtonText: {
    fontSize: 18,
    color: "#D8707E",
    fontWeight: "bold",
  },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 30,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  separatorText: {
    marginHorizontal: 10,
    color: "#8A8A8A",
  },
  socialLoginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    borderColor: "#E0E0E0",
    borderWidth: 1,
    marginHorizontal: 12,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 14,
    color: "#8A8A8A",
  },
  signupLink: {
    color: "#D8707E",
    fontWeight: "bold",
  },
});

export default LoginScreen;
