// In src/screens/HomeScreen.tsx
import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackScreenProps } from "@react-navigation/stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { jwtDecode } from "jwt-decode"; // Import thư viện vừa cài

type Props = StackScreenProps<RootStackParamList, "Home">;

const HomeScreen = ({ route, navigation }: Props) => {
  // Nhận token từ route.params
  const { token } = route.params;

  let expirationDate: Date | null = null;
  try {
    // Giải mã token để lấy thông tin, cụ thể là 'exp' (expiration time)
    const decoded: { exp: number } = jwtDecode(token);
    // 'exp' là timestamp tính bằng giây, cần nhân 1000 để thành mili giây
    expirationDate = new Date(decoded.exp * 1000);
  } catch (e) {
    console.error("Lỗi giải mã token:", e);
  }

  const handleLogout = async () => {
    // Chỉ cần xóa token khi logout
    await AsyncStorage.removeItem("appToken");
    navigation.replace("Login");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Successful!</Text>

      <Text style={styles.label}>Your Token:</Text>
      <Text style={styles.tokenText} selectable={true}>
        {token}
      </Text>

      <Text style={styles.label}>Expires At:</Text>
      <Text style={styles.text}>
        {expirationDate
          ? expirationDate.toLocaleString()
          : "Could not read expiration"}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Logout" onPress={handleLogout} />
      </View>
    </View>
  );
};

// Cập nhật styles để hiển thị đẹp hơn
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    alignSelf: "flex-start",
  },
  tokenText: {
    fontSize: 12,
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    color: "#333",
  },
  text: { fontSize: 16, marginBottom: 10 },
  buttonContainer: { marginTop: 30 },
});

export default HomeScreen;
