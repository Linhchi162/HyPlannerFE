import React, { useState } from "react"; // Thêm React
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator, // Thêm ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import apiClient from "../../api/client"; // Import apiClient

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Thêm loading state
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert("Lỗi", "Vui lòng nhập email của bạn");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/forgot-password", {
        email,
      });
      Alert.alert("Thành công", response.data.message);
      navigation.navigate("OTP", { email });
    } catch (error) {
      Alert.alert(
        "Lỗi",
        (error instanceof Error && error.message) ||
          "Đã có lỗi xảy ra, vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" translucent={false} />
      <View style={styles.formContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Hãy nhập lại email của bạn</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="example@gmail.com"
            placeholderTextColor="#9ca3af"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { opacity: !email || isLoading ? 0.6 : 1 }]}
          onPress={handleSubmit}
          activeOpacity={0.7}
          disabled={!email || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Tiếp theo</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    width: "100%",
    padding: 32,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontFamily: "Agbalumo",
    fontSize: 24,
    fontWeight: "500",
    color: "#e56e8a",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    fontFamily: "Montserrat-Medium",
    height: 48,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#1f2937",
  },
  button: {
    height: 48,
    backgroundColor: "#f9cbd6",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#000000",
  },
});
