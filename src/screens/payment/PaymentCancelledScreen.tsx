import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { XCircle } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/core";

export default function PaymentCancelledScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fff1f2"
        translucent={false}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.innerContainer}>
            <View style={[styles.iconContainer, styles.cancelledBg]}>
              <XCircle size={40} color="#ef4444" strokeWidth={2.5} />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Giao dịch{"\n"}đã bị hủy</Text>
            </View>

            <Text style={styles.subtitle}>
              Thanh toán chưa được hoàn tất. Vui lòng thử lại nếu bạn muốn nâng
              cấp tài khoản.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelledBg]}
                activeOpacity={0.8}
                onPress={() => {
                  // Quay lại màn hình trước đó (màn hình nâng cấp)
                  navigation.goBack();
                }}
              >
                <Text style={styles.buttonText}>Thử lại</Text>
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
    backgroundColor: "#fff1f2", // Nền đỏ/hồng nhạt
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
  cancelledBg: {
    backgroundColor: "#fee2e2", // Màu nền icon/button đỏ
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
