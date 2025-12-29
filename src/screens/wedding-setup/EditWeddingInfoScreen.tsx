import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Calendar } from "lucide-react-native";
import type { RootStackParamList } from "../../navigation/types";
import type { StackNavigationProp } from "@react-navigation/stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import { updateWeddingEvent } from "../../service/weddingEventService";
import { getWeddingEvent } from "../../service/weddingEventService";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import logger from "../../utils/logger";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const COLORS = {
  background: "#F9F9F9",
  card: "#FFFFFF",
  textPrimary: "#1F2024",
  textSecondary: "#6D6D6D",
  primary: "#F2C4CE",
  iconColor: "#D8707E",
  white: "#FFFFFF",
};

const EditWeddingInfoScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const route = useRoute();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { eventId } = route.params as RootStackParamList["EditWeddingInfo"];
  const user = useAppSelector((state) => state.auth.user);
  const weddingEvent = useAppSelector(
    (state) => state.weddingEvent.getWeddingEvent.weddingEvent
  );

  // Initialize state with current values
  const [brideName, setBrideName] = useState(weddingEvent?.brideName || "");
  const [groomName, setGroomName] = useState(weddingEvent?.groomName || "");
  const [brideFather, setBrideFather] = useState(
    weddingEvent?.brideFather || ""
  );
  const [brideMother, setBrideMother] = useState(
    weddingEvent?.brideMother || ""
  );
  const [groomFather, setGroomFather] = useState(
    weddingEvent?.groomFather || ""
  );
  const [groomMother, setGroomMother] = useState(
    weddingEvent?.groomMother || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date>(
    weddingEvent?.timeToMarried
      ? new Date(weddingEvent.timeToMarried)
      : new Date()
  );
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (date) {
      setSelectedDate(date);
    }
  };

  const formatDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSave = async () => {
    if (isLoading) return;

    // Validation
    if (!brideName.trim() || !groomName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập tên cô dâu và chú rể.");
      return;
    }

    if (selectedDate <= new Date()) {
      Alert.alert("Lỗi", "Ngày cưới phải là ngày trong tương lai.");
      return;
    }

    setIsLoading(true);

    try {
      const updateData = {
        brideName: brideName.trim(),
        groomName: groomName.trim(),
        brideFather: brideFather.trim(),
        brideMother: brideMother.trim(),
        groomFather: groomFather.trim(),
        groomMother: groomMother.trim(),
        timeToMarried: selectedDate.toISOString(),
      };

      await updateWeddingEvent(eventId, updateData, dispatch);

      // Refresh wedding event data
      if (user?.id || user?._id) {
        await getWeddingEvent(user.id || user._id, dispatch);
      }

      Alert.alert("Thành công", "Đã cập nhật thông tin kế hoạch cưới.");
      navigation.goBack();
    } catch (error) {
      logger.error("Update Wedding Event Error:", error);
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message?: string }).message
          : undefined;
      Alert.alert("Lỗi", errorMessage || "Có lỗi xảy ra khi cập nhật");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ArrowLeft size={responsiveWidth(24)} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông tin kế hoạch cưới</Text>
          <View style={{ width: responsiveWidth(24) }} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Row 1: Bride and Groom Names */}
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Tên cô dâu</Text>
              <TextInput
                style={styles.input}
                value={brideName}
                onChangeText={setBrideName}
                placeholder="Nhập tên cô dâu"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Tên chú rể</Text>
              <TextInput
                style={styles.input}
                value={groomName}
                onChangeText={setGroomName}
                placeholder="Nhập tên chú rể"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Row 2: Bride Parents */}
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Ba cô dâu</Text>
              <TextInput
                style={styles.input}
                value={brideFather}
                onChangeText={setBrideFather}
                placeholder="Nhập tên ba"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Mẹ cô dâu</Text>
              <TextInput
                style={styles.input}
                value={brideMother}
                onChangeText={setBrideMother}
                placeholder="Nhập tên mẹ"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Row 3: Groom Parents */}
          <View style={styles.row}>
            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Ba chú rể</Text>
              <TextInput
                style={styles.input}
                value={groomFather}
                onChangeText={setGroomFather}
                placeholder="Nhập tên ba"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            <View style={styles.halfInputGroup}>
              <Text style={styles.label}>Mẹ chú rể</Text>
              <TextInput
                style={styles.input}
                value={groomMother}
                onChangeText={setGroomMother}
                placeholder="Nhập tên mẹ"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>

          {/* Wedding Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ngày cưới</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
              <Calendar size={responsiveWidth(24)} color={COLORS.iconColor} />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </ScrollView>

        {/* Fixed Save Button at Bottom */}
        <View
          style={[
            styles.fixedButtonContainer,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? Math.max(insets.bottom, responsiveHeight(16))
                  : responsiveHeight(16),
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveButtonText}>Lưu thay đổi</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(20),
    paddingVertical: responsiveHeight(16),
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  headerTitle: {
    fontSize: responsiveFont(18),
    fontFamily: "Agbalumo",
    color: COLORS.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: responsiveWidth(20),
    paddingTop: responsiveHeight(20),
  },
  scrollContent: {
    paddingBottom: responsiveHeight(20),
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(20),
    gap: responsiveWidth(12),
  },
  halfInputGroup: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: responsiveHeight(20),
  },
  label: {
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-Medium",
    color: COLORS.textPrimary,
    marginBottom: responsiveHeight(8),
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(16),
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-Regular",
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dateInput: {
    backgroundColor: COLORS.card,
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  dateText: {
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-Regular",
    color: COLORS.textPrimary,
  },
  fixedButtonContainer: {
    paddingHorizontal: responsiveWidth(20),
    paddingVertical: responsiveHeight(16),
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  saveButton: {
    backgroundColor: COLORS.iconColor,
    borderRadius: responsiveWidth(12),
    paddingVertical: responsiveHeight(18),
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: responsiveFont(18),
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.white,
  },
});

export default EditWeddingInfoScreen;
