import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Dialog, Portal } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../assets/styles/utils/responsive";
import { useState } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { joinWeddingEvent } from "../service/weddingEventService";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../store";
import type { RootStackParamList } from "../navigation/AppNavigator";

interface JoinWeddingAppBarProps {
  onBack: () => void;
}
const JoinWeddingAppBar = ({ onBack }: JoinWeddingAppBarProps) => {
  return (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Entypo name="chevron-left" size={24} color="#FFF" />
      </TouchableOpacity>
    </Appbar.Header>
  );
};

export default function JoinWeddingEvent() {
  const [code, setCode] = useState<string>("");
  const isFormValid = code.trim().length > 0;
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string>("");
  const [showError, setShowError] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  const userId = "68958dd1b6d033a5f26fb42d"; // Thay thế bằng userId thực tế của bạn
  const handleJoinEvent = async () => {
    setShowConfirm(false);
    try {
      await joinWeddingEvent(code, userId, dispatch);
      navigation.navigate("TaskList" as never);
    } catch (error: any) {
      setError(error);
      setShowError(true);
    }
  };
  return (
    <View style={styles.container}>
      <JoinWeddingAppBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Tham Gia Vào Kế Hoạch Cưới</Text>
          <Text style={styles.description}>
            Hãy nhập mã mời để tham gia vào kế hoạch cưới của người thân hoặc
            bạn bè. Cùng nhau đóng góp ý tưởng và hỗ trợ chuẩn bị cho ngày trọng
            đại trở nên hoàn hảo và ý nghĩa hơn!
          </Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Hãy nhập mã mời của bạn*</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập mã mời"
              value={code}
              onChangeText={setCode}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="done"
              placeholderTextColor="#B0B0B0"
            />
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            disabled={!isFormValid}
            onPress={() => setShowConfirm(true)}
          >
            <Text
              style={[
                styles.submitButtonText,
                { opacity: isFormValid ? 1 : 0.7 },
              ]}
            >
              Tham Gia
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <Portal>
          <Dialog visible={showConfirm} onDismiss={() => setShowConfirm(false)}>
            <Dialog.Title>Xác nhận tham gia</Dialog.Title>
            <Dialog.Content>
              <Text>Bạn có chắc chắn muốn tham gia vào kế hoạch cưới này?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowConfirm(false)}>Hủy</Button>
              <Button onPress={handleJoinEvent}>Xác nhận</Button>
            </Dialog.Actions>
          </Dialog>
          {/* Dialog báo lỗi */}
          <Dialog visible={showError} onDismiss={() => setShowError(false)}>
            <Dialog.Title>Thông báo</Dialog.Title>
            <Dialog.Content>
              <Text>{error}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowError(false)}>Đóng</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: responsiveWidth(10),
    backgroundColor: "#ceb6b6ff",
    borderRadius: 20,
    elevation: 0,
  },
  appbarHeader: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#ECD9D9",
  },
  contentContainer: {
    paddingHorizontal: responsiveWidth(15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveHeight(100),
  },
  title: {
    fontSize: responsiveFont(30),
    color: "#333",
    fontFamily: "Gwendolyn-Regular",
    marginTop: responsiveHeight(10),
    textAlign: "center",
  },
  description: {
    fontSize: responsiveFont(12),
    color: "#555",
    textAlign: "center",
    marginVertical: responsiveHeight(10),
    marginBottom: responsiveHeight(20),
  },
  inputWrapper: {
    flex: 1,
    width: "100%",
  },
  label: {
    fontSize: responsiveFont(12),
    color: "#831843",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: responsiveFont(13),
    fontFamily: "Montserrat-Regular",
    borderWidth: 1,
    borderColor: "#F9E2E7",
    marginBottom: 0,
  },
  submitButton: {
    backgroundColor: "#f19aaeff",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    opacity: 0.7,
    marginTop: responsiveHeight(22),
    width: "100%",
  },
  submitButtonText: {
    fontSize: responsiveFont(14),
    fontWeight: "700",
  },
});
