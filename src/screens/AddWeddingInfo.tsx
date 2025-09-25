import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Appbar } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../assets/styles/utils/responsive";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import {
  MainTabParamList,
  RootStackParamList,
} from "../navigation/AppNavigator";
import { createWeddingEvent } from "../service/weddingEventService";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store";
import { selectCurrentUser } from "../store/authSlice";

interface AddWeddingAppBarProps {
  onBack: () => void;
}
const AddWeddingAppBar = ({ onBack }: AddWeddingAppBarProps) => {
  return (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Entypo name="chevron-left" size={24} color="#FFF" />
      </TouchableOpacity>
    </Appbar.Header>
  );
};

export default function AddWeddingInfo() {
  const [brideName, setBrideName] = useState("");
  const [groomName, setGroomName] = useState("");
  const [budget, setBudget] = useState<number | null>(null);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [budgetError, setBudgetError] = useState<string>(""); // Lưu thông báo lỗi
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isFormValid =
    brideName.trim() &&
    groomName.trim() &&
    date &&
    budget !== null &&
    budget > 0;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  // const tabNavigator = useNavigation<NavigationProp<MainTabParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectCurrentUser);
  if (!user) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const userId = user.id || user._id;
  const handleDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCreateWeddingEvent = async () => {
    if (budget === null || budget <= 0) {
      setBudgetError("Ngân sách không hợp lệ");
      return;
    }
    try {
      await createWeddingEvent(
        {
          creatorId: userId,
          brideName,
          groomName,
          budget,
          timeToMarried: date ? date.toISOString() : "",
        },
        dispatch
      );
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }], // Điều hướng đến 'Main', tự động hiển thị tab Home
      });
    } catch (error) {
      console.error("Error creating wedding event:", error);
    }
  };
  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  return (
    <View style={styles.container}>
      <AddWeddingAppBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Kế Hoạch Cưới</Text>
          <Text style={styles.description}>
            Ngày cưới là một trong những khoảnh khắc ý nghĩa nhất trong cuộc đời
            của mỗi người. Việc lập kế hoạch từ sớm không chỉ giúp bạn chuẩn bị
            chu đáo mà còn lưu giữ những kỷ niệm đẹp trong từng bước chuẩn bị.
            Hãy tạo một kế hoạch đám cưới để biến ngày trọng đại của bạn trở nên
            hoàn hảo và trọn vẹn nhất.
          </Text>
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Họ tên cô dâu*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ tên cô dâu"
                  value={brideName}
                  onChangeText={setBrideName}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Họ tên chú rể*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập họ tên chú rể"
                  value={groomName}
                  onChangeText={setGroomName}
                  placeholderTextColor="#B0B0B0"
                />
              </View>
            </View>
            <View style={styles.inputWrapperFull}>
              <Text style={styles.label}>Ngân sách dự kiến*</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập ngân sách dự kiến"
                value={budget !== null ? formatNumber(budget) : ""} // Hiển thị giá trị dưới dạng chuỗi
                onChangeText={(value) => {
                  const numericValue = parseInt(value.replace(/\./g, ""), 10);
                  if (!isNaN(numericValue)) {
                    setBudget(numericValue); // Cập nhật state nếu giá trị hợp lệ
                    setBudgetError(""); // Xóa thông báo lỗi nếu có
                  } else {
                    setBudget(null); // Đặt lại nếu giá trị không hợp lệ
                    setBudgetError("Ngân sách phải là số và lớn hơn 0"); // Hiển thị thông báo lỗi
                  }
                }}
                keyboardType="numeric"
                placeholderTextColor="#B0B0B0"
              />
              {budgetError ? (
                <Text style={styles.errorText}>{budgetError}</Text>
              ) : null}
            </View>
            <View style={styles.inputWrapperFull}>
              <Text style={styles.label}>Ngày tổ chức đám cưới (Dự kiến)*</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.8}
              >
                <Text style={{ color: date ? "#333" : "#B0B0B0" }}>
                  {date
                    ? date.toLocaleDateString("vi-VN")
                    : "Chọn ngày tổ chức"}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={date || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </View>
            <TouchableOpacity
              style={styles.createButton}
              disabled={!isFormValid}
              activeOpacity={0.8}
              onPress={handleCreateWeddingEvent}
            >
              <Text
                style={[
                  styles.createButtonText,
                  { opacity: isFormValid ? 1 : 0.5 },
                ]}
              >
                Tạo kế hoạch
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    marginTop: responsiveHeight(50),
  },
  title: {
    fontSize: responsiveFont(35),
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
  form: {
    width: "100%",
    borderRadius: 16,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
  },
  inputWrapperFull: {
    marginTop: 12,
  },
  label: {
    fontSize: responsiveFont(12),
    color: "#831843",
    fontFamily: "Montserrat-SemiBold",
    marginBottom: 4,
  },
  note: {
    fontSize: responsiveFont(10),
    color: "#6B7280",
    fontFamily: "Montserrat-Regular",
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
  createButton: {
    backgroundColor: "#f19aaeff",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    opacity: 0.7,
    marginTop: responsiveHeight(22),
  },
  createButtonText: {
    fontSize: responsiveFont(14),
    fontWeight: "700",
  },
  errorText: {
    color: "red",
    fontSize: responsiveFont(11),
    marginTop: 4,
    fontFamily: "Montserrat-Regular",
  },
});
