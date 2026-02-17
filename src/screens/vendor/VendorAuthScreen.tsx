import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  loginVendor,
  registerVendor,
  resetVendorPassword,
} from "../../service/vendorAuthService";

export default function VendorAuthScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    // Nếu VendorAuth được render khi chưa có history (ví dụ đang ở VendorMain nhưng vendor đã logout)
    // thì reset về màn đăng nhập user.
    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    try {
      setLoading(true);
      if (mode === "login") {
        await loginVendor(email, password);
        navigation.reset({
          index: 0,
          routes: [{ name: "VendorMain" as any }],
        });
      } else {
        if (!name || !category || !location) {
          Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ thông tin.");
          return;
        }
        await registerVendor({
          email,
          password,
          name,
          category,
          location,
        });
        navigation.reset({
          index: 0,
          routes: [{ name: "VendorMain" as any }],
        });
      }
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể đăng nhập/đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      Alert.alert("Thiếu email", "Vui lòng nhập email để đặt lại mật khẩu.");
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      Alert.alert("Email không hợp lệ", "Vui lòng nhập một email hợp lệ.");
      return;
    }
    try {
      setLoading(true);
      await resetVendorPassword(trimmedEmail);
      Alert.alert(
        "Đã gửi email",
        "Vui lòng kiểm tra hộp thư (và Spam) để đặt lại mật khẩu."
      );
    } catch (e: any) {
      Alert.alert("Lỗi", e?.message || "Không thể gửi email đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#ff5a7a"
        translucent={false}
      />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            {mode === "login" ? "Đăng nhập Vendor" : "Đăng ký Vendor"}
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Mật khẩu"
            placeholderTextColor="#9ca3af"
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />
          <TouchableOpacity
            onPress={() => setIsPasswordVisible((v) => !v)}
            hitSlop={10}
            style={styles.eyeBtn}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color="#6b7280" />
            ) : (
              <Eye size={20} color="#6b7280" />
            )}
          </TouchableOpacity>
        </View>

        {mode === "login" && (
          <TouchableOpacity
            style={styles.forgotPasswordBtn}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
        )}

        {mode === "register" && (
          <>
            <TextInput
              placeholder="Tên nhà cung cấp"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              placeholder="Danh mục dịch vụ"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={category}
              onChangeText={setCategory}
            />
            <TextInput
              placeholder="Khu vực hoạt động"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              value={location}
              onChangeText={setLocation}
            />
          </>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>
              {mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.modeToggle}
          onPress={() => setMode(mode === "login" ? "register" : "login")}
        >
          <Text style={styles.modeToggleText}>
            {mode === "login"
              ? "Chưa có tài khoản? Đăng ký"
              : "Đã có tài khoản? Đăng nhập"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    height: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    padding: responsiveWidth(16),
    gap: responsiveHeight(10),
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  passwordRow: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    height: responsiveHeight(44),
    flexDirection: "row",
    alignItems: "center",
    paddingRight: responsiveWidth(10),
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: responsiveWidth(12),
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  eyeBtn: {
    paddingHorizontal: responsiveWidth(6),
    height: "100%",
    justifyContent: "center",
  },
  forgotPasswordBtn: {
    alignSelf: "flex-start",
    marginTop: responsiveHeight(4),
  },
  forgotPasswordText: {
    fontSize: responsiveFont(12),
    color: "#ff5a7a",
    fontFamily: "Montserrat-SemiBold",
  },
  primaryBtn: {
    marginTop: responsiveHeight(6),
    backgroundColor: "#ff5a7a",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
  modeToggle: {
    marginTop: responsiveHeight(8),
    alignItems: "center",
  },
  modeToggleText: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
});
