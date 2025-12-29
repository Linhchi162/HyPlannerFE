import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";

import { RootStackParamList } from "../../navigation/types";
import { setCredentials, selectCurrentToken } from "../../store/authSlice";
import apiClient from "../../api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sử dụng RouteProp để có type-safety cho route.params
type OTPScreenRouteProp = RouteProp<RootStackParamList, "OTP">;

export default function OTPScreen() {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute<OTPScreenRouteProp>();
  const dispatch = useDispatch();
  const token = useSelector(selectCurrentToken);

  // Lấy params từ route để xác định luồng
  const { email, newEmail, from } = route.params || {};

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Alert.alert("Lỗi", "Vui lòng nhập mã OTP gồm 6 chữ số.");
      return;
    }
    Keyboard.dismiss();
    setIsLoading(true);

    // Sử dụng 'from' để phân biệt các luồng
    if (from === "register") {
      // Logic cho luồng XÁC THỰC ĐĂNG KÝ
      try {
        const response = await apiClient.post("/auth/verify-email", {
          email,
          otp,
        });
        const { token: newToken, user } = response.data;

        await AsyncStorage.setItem("appToken", newToken);

        dispatch(setCredentials({ user, token: newToken }));
        Alert.alert("Thành công", "Tài khoản của bạn đã được xác thực.");

        navigation.reset({
          index: 0,
          routes: [{ name: "InviteOrCreate" }],
        });
      } catch (error) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        Alert.alert("Lỗi", errorMessage || "Xác thực thất bại.");
      }
    } else if (from === "change-email") {
      // Logic cho luồng ĐỔI EMAIL
      try {
        const response = await apiClient.post("/auth/change-email/verify", {
          otp,
        });
        dispatch(setCredentials({ user: response.data, token }));
        Alert.alert("Thành công", "Email của bạn đã được cập nhật.");
        navigation.pop(2);
      } catch (error) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        Alert.alert("Lỗi", errorMessage || "Xác thực OTP thất bại.");
      }
    } else if (from === "forgot-password") {
      // Logic cho luồng QUÊN MẬT KHẨU
      try {
        const response = await apiClient.post("/auth/verify-otp", {
          email,
          otp,
        });
        Alert.alert("Thành công", "Mã OTP đã được xác thực.");
        navigation.navigate("ChangePassword", {
          email: email!,
          token: response.data.token,
        });
      } catch (error) {
        const errorMessage =
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message?: string }).message
            : undefined;
        Alert.alert(
          "Lỗi",
          errorMessage || "Mã OTP không chính xác hoặc đã hết hạn."
        );
      }
    } else {
      Alert.alert("Lỗi", "Không xác định được luồng hoạt động.");
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    try {
      if (from === "register") {
        // API register đã được thiết kế để gửi lại OTP nếu user chưa xác thực
        await apiClient.post("/auth/register", {
          email,
          fullName: "Resend",
          password: "resendpassword",
        });
        Alert.alert("Thông báo", `Đã gửi lại mã OTP đến ${email}.`);
      } else if (from === "change-email") {
        await apiClient.post("/auth/change-email/request", { newEmail });
        Alert.alert("Thông báo", `Đã gửi lại mã OTP đến ${newEmail}.`);
      } else if (from === "forgot-password") {
        await apiClient.post("/auth/forgot-password", { email });
        Alert.alert("Thông báo", `Đã gửi lại mã OTP đến ${email}.`);
      }
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      Alert.alert("Lỗi", errorMessage || "Không thể gửi lại OTP.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent={false} />
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Xác thực OTP</Text>
          <Text style={styles.subtitle}>
            Nhập mã OTP được gửi đến email{"\n"}
            <Text style={{ fontWeight: "bold" }}>{email || newEmail}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.otpInput}
            value={otp}
            onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ""))}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus={true}
          />

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Không nhận được mã?{" "}
              <Text style={styles.resendLink} onPress={handleResend}>
                Gửi lại
              </Text>
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              { opacity: otp.length !== 6 || isLoading ? 0.6 : 1 },
            ]}
            onPress={handleVerify}
            activeOpacity={0.7}
            disabled={otp.length !== 6 || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text style={styles.buttonText}>Xác nhận</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  contentContainer: {
    width: "100%",
    padding: 32,
    marginTop: 64,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 48,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 28,
    color: "#e56e8a",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 24,
  },
  form: {
    alignItems: "center",
  },
  otpInput: {
    height: 56,
    width: "100%",
    marginVertical: 16,
    marginBottom: 40,
    borderBottomWidth: 2,
    borderColor: "#e5e7eb",
    textAlign: "center",
    fontSize: 24,
    letterSpacing: 8,
    fontFamily: "Montserrat-Medium",
    color: "#1f2937",
  },
  resendContainer: {
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    fontFamily: "Montserrat-Medium",
  },
  resendLink: {
    color: "#e56e8a",
    fontWeight: "bold",
    textDecorationLine: "none",
    marginLeft: 4,
    fontFamily: "Montserrat-SemiBold",
  },
  button: {
    height: 52,
    backgroundColor: "#f9cbd6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 18,
    color: "#000000",
  },
});
