import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { type RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

export default function BeginScreen() {
  const insets = useSafeAreaInsets();
  const [isLoginPressed, setIsLoginPressed] = useState(false);
  const [isRegisterPressed, setIsRegisterPressed] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleLoginPress = () => {
    navigation.navigate("Login");
  };

  const handleRegisterPress = () => {
    navigation.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f9f9f9"
        translucent={false}
      />
      <View
        style={[
          styles.content,
          {
            paddingBottom:
              Platform.OS === "android"
                ? responsiveHeight(32) + insets.bottom
                : responsiveHeight(32),
          },
        ]}
      >
        <View style={styles.mainArea}>
          <Text style={styles.title}>Hỷ Planner</Text>
          <Text style={styles.subtitle}>Chào mừng đến với ứng dụng</Text>
          <Text style={styles.description}>
            Thiết kế đám cưới hoàn hảo của bạn. Bắt đầu hành trình tuyệt vời
            ngay hôm nay!
          </Text>

          {/* Login Button with onPress handler */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              { transform: [{ scale: isLoginPressed ? 0.98 : 1 }] },
            ]}
            activeOpacity={1}
            onPress={handleLoginPress}
            onPressIn={() => setIsLoginPressed(true)}
            onPressOut={() => setIsLoginPressed(false)}
          >
            <LogIn size={24} color="#1f2937" style={styles.buttonIcon} />
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerButton,
              { transform: [{ scale: isRegisterPressed ? 0.98 : 1 }] },
            ]}
            activeOpacity={1}
            onPress={handleRegisterPress}
            onPressIn={() => setIsRegisterPressed(true)}
            onPressOut={() => setIsRegisterPressed(false)}
          >
            <UserPlus size={24} color="#1f2937" style={styles.buttonIcon} />
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>
          © 2025 Hỷ Planner. Tất cả quyền được bảo lưu.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(48),
    paddingVertical: responsiveHeight(32),
  },
  mainArea: {
    width: "100%",
    maxWidth: responsiveWidth(500),
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(48),
    color: "#9e182b",
    marginBottom: responsiveHeight(12),
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(24),
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: responsiveHeight(28),
    textAlign: "center",
  },
  description: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(18),
    color: "#6b7280",
    lineHeight: responsiveHeight(28),
    marginBottom: responsiveHeight(64),
    textAlign: "center",
    paddingHorizontal: responsiveWidth(16),
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#f9cbd6",
    paddingVertical: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(32),
    borderRadius: borderRadius.lg,
    marginBottom: responsiveHeight(20),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontFamily: "Montserrat-Medium",
    color: "#1f2937",
    fontSize: responsiveFont(20),
    fontWeight: "600",
  },
  registerButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(32),
    borderRadius: borderRadius.lg,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    fontFamily: "Montserrat-Medium",
    color: "#1f2937",
    fontSize: responsiveFont(20),
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: responsiveWidth(12),
  },
  footer: {
    paddingHorizontal: responsiveWidth(48),
    fontFamily: "Montserrat-Medium",
    color: "#9ca3af",
    fontSize: responsiveFont(15),
    textAlign: "center",
  },
});
