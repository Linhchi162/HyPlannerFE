import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { CheckCircle } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/core";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";

export default function PaymentSuccessScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Sau khi thanh toán thành công, gọi lại API để cập nhật trạng thái tài khoản
    // (ví dụ: từ FREE lên VIP) trong Redux store.
    // Điều này đảm bảo toàn bộ ứng dụng biết rằng người dùng đã nâng cấp.
    dispatch(fetchUserInvitation());
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f0fdf4"
        translucent={false}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.innerContainer}>
            <View style={[styles.iconContainer, styles.successBg]}>
              <CheckCircle size={40} color="#22c55e" strokeWidth={2.5} />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Thanh toán{"\n"}thành công!</Text>
            </View>

            <Text style={styles.subtitle}>
              Tài khoản của bạn đã được nâng cấp. Cảm ơn bạn đã tin tưởng Hỷ
              Planner!
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.successBg]}
                activeOpacity={0.8}
                onPress={() => {
                  // Điều hướng về tab Home bên trong MainTabNavigator
                  navigation.navigate("Main", { screen: "Home" });
                }}
              >
                <Text style={styles.buttonText}>Về trang chủ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0fdf4", // Nền xanh lá nhạt
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 24,
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 20,
    alignItems: "center",
  },
  innerContainer: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  successBg: {
    backgroundColor: "#dcfce7", // Màu nền icon/button xanh lá
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "500",
  },
});
