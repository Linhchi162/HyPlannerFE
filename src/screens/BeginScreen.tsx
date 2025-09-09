import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useState } from "react";
import { LogIn, UserPlus } from "lucide-react-native";
import { useNavigation, type NavigationProp } from "@react-navigation/native";
import { type RootStackParamList } from "../navigation/AppNavigator"; // Adjust the path as needed
import { StackNavigationProp } from "@react-navigation/stack";

export default function BeginScreen() {
  const [isLoginPressed, setIsLoginPressed] = useState(false);
  const [isRegisterPressed, setIsRegisterPressed] = useState(false);

  // Get the navigation object with type information
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleLoginPress = () => {
    // Navigate to the "Login" screen
    navigation.navigate("Login");
  };

  const handleRegisterPress = () => {
    // Navigate to a "Register" screen (if you have one)
    console.log("Register button pressed");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <View style={styles.content}>
        <Text style={styles.title}>Hỷ Planner</Text>
        <Text style={styles.subtitle}>Chào mừng đến với ứng dụng</Text>
        <Text style={styles.description}>
          Thiết kế đám cưới hoàn hảo của bạn. Bắt đầu hành trình tuyệt vời ngay
          hôm nay!
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
          <LogIn size={20} color="#1f2937" style={styles.buttonIcon} />
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
          <UserPlus size={20} color="#1f2937" style={styles.buttonIcon} />
          <Text style={styles.registerButtonText}>Đăng ký</Text>
        </TouchableOpacity>

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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#9e182b",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 24,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    lineHeight: 24,
    marginBottom: 64,
    textAlign: "center",
  },
  loginButton: {
    width: "100%",
    backgroundColor: "#f9cbd6",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "600",
  },
  registerButton: {
    width: "100%",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    marginBottom: 180,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  registerButtonText: {
    color: "#1f2937",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonIcon: {
    marginRight: 8,
  },
  footer: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
  },
});
