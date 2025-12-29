import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  ChevronLeft,
  Gift,
  Save,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { updateGuestGift } from "../../store/guestSlice";
import { RootStackParamList } from "../../navigation/types";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";

type GuestDetailScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GuestDetailScreen"
>;

const GuestDetailScreen = () => {
  const navigation = useNavigation<GuestDetailScreenNavigationProp>();
  const route = useRoute();
  const dispatch = useDispatch<AppDispatch>();

  const { guestId } = route.params as { guestId: string };
  const guests = useSelector((state: RootState) => state.guests?.guests || []);
  const guest = guests.find((g: any) => g._id === guestId);

  const [giftType, setGiftType] = useState<string>(guest?.gift?.type || "none");
  const [giftAmount, setGiftAmount] = useState<string>(
    guest?.gift?.amount?.toString() || ""
  );
  const [giftDescription, setGiftDescription] = useState<string>(
    guest?.gift?.description || ""
  );
  const [receivedDate, setReceivedDate] = useState<string>(
    guest?.gift?.receivedDate || new Date().toISOString()
  );
  const [receivedMethod, setReceivedMethod] = useState<string>(
    guest?.gift?.receivedMethod || "not_received"
  );
  const [returnedGift, setReturnedGift] = useState<boolean>(
    guest?.gift?.returnedGift || false
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  useEffect(() => {
    if (guest?.gift) {
      setGiftType(guest.gift.type || "none");
      setGiftAmount(guest.gift.amount?.toString() || "");
      setGiftDescription(guest.gift.description || "");
      setReceivedDate(guest.gift.receivedDate || new Date().toISOString());
      setReceivedMethod(guest.gift.receivedMethod || "not_received");
      setReturnedGift(guest.gift.returnedGift || false);
    }
  }, [guest]);

  const handleSaveGift = async () => {
    try {
      await dispatch(
        updateGuestGift({
          guestId,
          gift: {
            type: giftType,
            amount: giftAmount ? parseFloat(giftAmount) : undefined,
            description: giftDescription,
            receivedDate,
            receivedMethod,
            returnedGift,
          },
        })
      ).unwrap();

      Alert.alert("Thành công", "Đã cập nhật quà mừng!");
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Không thể cập nhật quà mừng");
    }
  };

  const formatCurrency = (value: string) => {
    const number = value.replace(/[^0-9]/g, "");
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (!guest) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không tìm thấy khách mời</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quà mừng cưới</Text>
        <TouchableOpacity onPress={handleSaveGift}>
          <Save size={24} color="#ff6b9d" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          paddingBottom:
            Platform.OS === "ios" ? responsiveHeight(40) : responsiveHeight(20),
        }}
      >
        {/* Guest Info */}
        <View style={styles.guestInfoCard}>
          <Text style={styles.guestName}>{guest.name}</Text>
          <Text style={styles.guestMeta}>
            {guest.group === "groom"
              ? "Nhà trai"
              : guest.group === "bride"
              ? "Nhà gái"
              : "Chung"}{" "}
            • {guest.totalGuests} người
          </Text>
        </View>

        {/* Gift Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Loại quà mừng</Text>
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                giftType === "none" && styles.typeButtonActive,
              ]}
              onPress={() => setGiftType("none")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  giftType === "none" && styles.typeButtonTextActive,
                ]}
              >
                Chưa có
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                giftType === "money" && styles.typeButtonActive,
              ]}
              onPress={() => setGiftType("money")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  giftType === "money" && styles.typeButtonTextActive,
                ]}
              >
                Tiền mặt
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                giftType === "item" && styles.typeButtonActive,
              ]}
              onPress={() => setGiftType("item")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  giftType === "item" && styles.typeButtonTextActive,
                ]}
              >
                Quà tặng
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                giftType === "both" && styles.typeButtonActive,
              ]}
              onPress={() => setGiftType("both")}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  giftType === "both" && styles.typeButtonTextActive,
                ]}
              >
                Cả hai
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Gift Amount (if money or both) */}
        {(giftType === "money" || giftType === "both") && (
          <View style={styles.section}>
            <Text style={styles.label}>Số tiền (VNĐ)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số tiền"
              value={formatCurrency(giftAmount)}
              onChangeText={(text) =>
                setGiftAmount(text.replace(/[^0-9]/g, ""))
              }
              keyboardType="numeric"
            />
            {giftAmount && (
              <Text style={styles.amountPreview}>
                {parseInt(giftAmount).toLocaleString("vi-VN")} đồng
              </Text>
            )}
          </View>
        )}

        {/* Gift Description */}
        {giftType !== "none" && (
          <View style={styles.section}>
            <Text style={styles.label}>Mô tả quà tặng</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="VD: Bộ chén sứ, Tranh treo tường, Voucher du lịch..."
              value={giftDescription}
              onChangeText={setGiftDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        )}

        {/* Received Date */}
        {giftType !== "none" && (
          <View style={styles.section}>
            <Text style={styles.label}>Ngày nhận quà</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6b7280" />
              <Text style={styles.datePickerText}>
                {new Date(receivedDate).toLocaleDateString("vi-VN")}
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={new Date(receivedDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selectedDate) {
                    setReceivedDate(selectedDate.toISOString());
                  }
                }}
              />
            )}
          </View>
        )}

        {/* Received Method */}
        {giftType !== "none" && (
          <View style={styles.section}>
            <Text style={styles.label}>Hình thức nhận quà</Text>
            <View style={styles.methodGroup}>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  receivedMethod === "at_event" && styles.methodButtonActive,
                ]}
                onPress={() => setReceivedMethod("at_event")}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    receivedMethod === "at_event" &&
                      styles.methodButtonTextActive,
                  ]}
                >
                  Tại tiệc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  receivedMethod === "bank_transfer" &&
                    styles.methodButtonActive,
                ]}
                onPress={() => setReceivedMethod("bank_transfer")}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    receivedMethod === "bank_transfer" &&
                      styles.methodButtonTextActive,
                  ]}
                >
                  Chuyển khoản
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  receivedMethod === "before_event" &&
                    styles.methodButtonActive,
                ]}
                onPress={() => setReceivedMethod("before_event")}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    receivedMethod === "before_event" &&
                      styles.methodButtonTextActive,
                  ]}
                >
                  Trước tiệc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  receivedMethod === "after_event" && styles.methodButtonActive,
                ]}
                onPress={() => setReceivedMethod("after_event")}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    receivedMethod === "after_event" &&
                      styles.methodButtonTextActive,
                  ]}
                >
                  Sau tiệc
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.methodButton,
                  receivedMethod === "not_received" &&
                    styles.methodButtonActive,
                ]}
                onPress={() => setReceivedMethod("not_received")}
              >
                <Text
                  style={[
                    styles.methodButtonText,
                    receivedMethod === "not_received" &&
                      styles.methodButtonTextActive,
                  ]}
                >
                  Chưa nhận
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Returned Gift Checkbox */}
        {giftType !== "none" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setReturnedGift(!returnedGift)}
            >
              {returnedGift ? (
                <CheckSquare size={24} color="#ff6b9d" />
              ) : (
                <Square size={24} color="#6b7280" />
              )}
              <Text style={styles.checkboxLabel}>Đã trả lễ</Text>
            </TouchableOpacity>
            <Text style={styles.checkboxHint}>
              Đánh dấu nếu bạn đã tặng quà đáp lễ cho khách mời này
            </Text>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Gift size={20} color="#ff6b9d" />
          <Text style={styles.infoText}>
            Thông tin quà mừng giúp bạn ghi nhận và tổng kết sau lễ cưới để gửi
            lời cảm ơn phù hợp đến từng khách mời.
          </Text>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveGift}>
          <Text style={styles.saveButtonText}>Lưu thông tin</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#9ca3af",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  content: {
    flex: 1,
  },
  guestInfoCard: {
    margin: responsiveWidth(16),
    padding: responsiveWidth(16),
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  guestName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  guestMeta: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#6b7280",
  },
  section: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(20),
  },
  label: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    marginBottom: responsiveHeight(12),
  },
  buttonGroup: {
    flexDirection: "row",
    gap: responsiveWidth(8),
  },
  typeButton: {
    flex: 1,
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: "#fef3f2",
    borderColor: "#ff6b9d",
  },
  typeButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  typeButtonTextActive: {
    color: "#ff6b9d",
  },
  input: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    minHeight: responsiveHeight(100),
    textAlignVertical: "top",
  },
  amountPreview: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(16),
    color: "#ff6b9d",
    marginTop: responsiveHeight(8),
  },
  infoCard: {
    flexDirection: "row",
    margin: responsiveWidth(16),
    padding: responsiveWidth(16),
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(12),
    gap: responsiveWidth(12),
  },
  infoText: {
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveHeight(20),
  },
  saveButton: {
    backgroundColor: "#ff6b9d",
    margin: responsiveWidth(16),
    paddingVertical: responsiveHeight(16),
    borderRadius: responsiveWidth(12),
    alignItems: "center",
    marginBottom: responsiveHeight(40),
  },
  saveButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#ffffff",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  datePickerText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  methodGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
  },
  methodButton: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(8),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  methodButtonActive: {
    backgroundColor: "#ff6b9d",
    borderColor: "#ff6b9d",
  },
  methodButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  methodButtonTextActive: {
    color: "#ffffff",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
  },
  checkboxLabel: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#1f2937",
  },
  checkboxHint: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#9ca3af",
    marginTop: responsiveHeight(8),
    marginLeft: responsiveWidth(36),
  },
});

export default GuestDetailScreen;
