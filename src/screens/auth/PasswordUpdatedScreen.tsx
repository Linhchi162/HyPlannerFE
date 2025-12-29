import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import { Check } from "lucide-react-native";
import { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useNavigation } from "@react-navigation/core";

export default function PasswordUpdatedScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f9fafb"
        translucent={false}
      />
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.innerContainer}>
            <View style={styles.iconContainer}>
              <Check size={32} color="#000000" strokeWidth={3} />
            </View>

            <View style={styles.titleContainer}>
              <Text style={styles.title}>Đổi mật khẩu{"\n"}thành công</Text>
            </View>

            <Text style={styles.subtitle}>
              Bây giờ bạn có thể sử dụng mật khẩu mới để đăng nhập
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                activeOpacity={0.8}
                onPress={() => {
                  navigation.navigate("Login");
                }}
              >
                <Text style={styles.buttonText}>Tiếp tục</Text>
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
    backgroundColor: "#f9fafb",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 54,
  },
  innerContainer: {
    alignItems: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#f9cbd6",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  titleContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    paddingTop: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#f9cbd6",
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
});
