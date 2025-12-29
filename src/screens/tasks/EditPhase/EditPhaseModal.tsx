import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Button, Divider } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../../assets/styles/utils/responsive";

interface Phase {
  _id: string;
  phaseTimeStart: string;
  phaseTimeEnd: string;
}

interface EditPhaseModalProps {
  visible: boolean;
  phase: Phase | null;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isFirstPhase?: boolean;
  projectStartDate?: string;
  weddingDate?: string;
  allPhases?: Phase[];
  onPhasesAdjusted?: (adjustedPhases: Phase[]) => void;
  loading?: boolean;
}

const EditPhaseModal = ({
  visible,
  phase,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onSave,
  onCancel,
  isFirstPhase = false,
  projectStartDate,
  weddingDate,
  allPhases = [],
  onPhasesAdjusted,
  loading = false,
}: EditPhaseModalProps) => {
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());
  const [selectedEndDate, setSelectedEndDate] = useState(new Date());

  // Convert string date to Date object
  const parseDate = (dateString: string) => {
    const [day, month, year] = dateString.split("/");
    return new Date(parseInt(`20${year}`), parseInt(month) - 1, parseInt(day));
  };

  // Format Date object to string
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  // Tính số ngày giữa 2 dates
  const getDaysBetween = (start: Date, end: Date) => {
    const diffTime = end.getTime() - start.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Điều chỉnh các phases sau khi edit current phase
  const adjustSubsequentPhases = (newEndDate: Date) => {
    if (!phase || !allPhases.length || !onPhasesAdjusted) return;

    // Tìm index của phase hiện tại
    const currentIndex = allPhases.findIndex((p) => p._id === phase._id);
    if (currentIndex === -1 || currentIndex === allPhases.length - 1) return;

    // Lấy wedding date nếu có
    const weddingDateObj = weddingDate ? parseDate(weddingDate) : null;

    const adjustedPhases = [...allPhases];
    let previousEndDate = newEndDate;

    // Duyệt qua các phases sau current phase
    for (let i = currentIndex + 1; i < adjustedPhases.length; i++) {
      const currentPhase = adjustedPhases[i];
      const oldStart = parseDate(
        formatDate(new Date(currentPhase.phaseTimeStart))
      );
      const oldEnd = parseDate(formatDate(new Date(currentPhase.phaseTimeEnd)));
      const phaseDuration = getDaysBetween(oldStart, oldEnd);

      // Ngày bắt đầu mới = ngày kết thúc phase trước + 1
      const newStart = new Date(previousEndDate);
      newStart.setDate(newStart.getDate() + 1);

      // Ngày kết thúc mới = ngày bắt đầu mới + duration
      const newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + phaseDuration);

      // Kiểm tra nếu là phase cuối (phase 10) và vượt quá wedding date
      if (i === adjustedPhases.length - 1 && weddingDateObj) {
        if (newEnd > weddingDateObj) {
          // Điều chỉnh phase cuối để kết thúc đúng ngày cưới
          adjustedPhases[i] = {
            ...currentPhase,
            phaseTimeStart: newStart.toISOString(),
            phaseTimeEnd: weddingDateObj.toISOString(),
          };
        } else {
          adjustedPhases[i] = {
            ...currentPhase,
            phaseTimeStart: newStart.toISOString(),
            phaseTimeEnd: newEnd.toISOString(),
          };
        }
      } else {
        adjustedPhases[i] = {
          ...currentPhase,
          phaseTimeStart: newStart.toISOString(),
          phaseTimeEnd: newEnd.toISOString(),
        };
      }

      previousEndDate = new Date(adjustedPhases[i].phaseTimeEnd);
    }

    // Gọi callback để update phases
    onPhasesAdjusted(adjustedPhases);
  };

  // Lấy ngày tối thiểu cho ngày bắt đầu (chỉ cho giai đoạn đầu)
  const getMinimumStartDate = () => {
    if (isFirstPhase && projectStartDate) {
      return parseDate(projectStartDate);
    }
    return undefined;
  };

  // Lấy ngày tối thiểu cho ngày kết thúc (phải sau ngày bắt đầu ít nhất 1 ngày)
  const getMinimumEndDate = () => {
    if (startDate) {
      const startDateObj = parseDate(startDate);
      // Thêm 1 ngày để đảm bảo ngày kết thúc phải sau ngày bắt đầu
      const nextDay = new Date(startDateObj);
      nextDay.setDate(startDateObj.getDate() + 1);
      return nextDay;
    }
    return new Date();
  };

  const onStartDatePickerChange = (event: any, date?: Date) => {
    const currentDate = date || selectedStartDate;
    setShowStartDatePicker(Platform.OS === "ios");

    // Kiểm tra nếu là giai đoạn đầu và ngày chọn nhỏ hơn ngày bắt đầu dự án
    const minimumDate = getMinimumStartDate();
    if (minimumDate && currentDate < minimumDate) {
      setSelectedStartDate(minimumDate);
      onStartDateChange(formatDate(minimumDate));
      return;
    }

    setSelectedStartDate(currentDate);
    onStartDateChange(formatDate(currentDate));

    // Kiểm tra và cập nhật ngày kết thúc nếu cần thiết
    if (endDate) {
      const endDateObj = parseDate(endDate);
      const nextDay = new Date(currentDate);
      nextDay.setDate(currentDate.getDate() + 1);

      // Nếu ngày kết thúc hiện tại không hợp lệ (trước hoặc bằng ngày bắt đầu mới)
      if (endDateObj <= currentDate) {
        setSelectedEndDate(nextDay);
        onEndDateChange(formatDate(nextDay));
      }
    }
  };

  const onEndDatePickerChange = (event: any, date?: Date) => {
    const currentDate = date || selectedEndDate;
    setShowEndDatePicker(Platform.OS === "ios");

    // Kiểm tra ngày kết thúc phải sau ngày bắt đầu
    const minimumEndDate = getMinimumEndDate();
    if (currentDate < minimumEndDate) {
      setSelectedEndDate(minimumEndDate);
      onEndDateChange(formatDate(minimumEndDate));
      return;
    }

    setSelectedEndDate(currentDate);
    onEndDateChange(formatDate(currentDate));

    // Điều chỉnh các phases sau nếu cần
    adjustSubsequentPhases(currentDate);
  };

  const showStartPicker = () => {
    if (startDate) {
      setSelectedStartDate(parseDate(startDate));
    }
    setShowStartDatePicker(true);
  };

  const showEndPicker = () => {
    if (endDate) {
      setSelectedEndDate(parseDate(endDate));
    }
    setShowEndDatePicker(true);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chỉnh sửa giai đoạn</Text>
          <Divider style={styles.divider} />

          {/* Start Date Picker */}
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Ngày bắt đầu</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={showStartPicker}
            >
              <Text style={styles.dateText}>{startDate || "Chọn ngày"}</Text>
              <Feather name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* End Date Picker */}
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateLabel}>Ngày kết thúc</Text>
            <TouchableOpacity style={styles.dateInput} onPress={showEndPicker}>
              <Text style={styles.dateText}>{endDate || "Chọn ngày"}</Text>
              <Feather name="calendar" size={20} color="#666" />
            </TouchableOpacity>
            {startDate && (
              <Text style={styles.helperText}>
                * Ngày kết thúc phải sau ngày bắt đầu ({startDate})
              </Text>
            )}
          </View>

          <View style={styles.modalButtons}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={styles.cancelButton}
            >
              Hủy
            </Button>
            <Button
              mode="contained"
              onPress={onSave}
              style={styles.saveButton}
              buttonColor="#D95D74"
              disabled={loading}
              loading={loading}
            >
              Lưu
            </Button>
          </View>

          {/* Date Time Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              testID="startDateTimePicker"
              value={selectedStartDate}
              mode="date"
              display="default"
              minimumDate={getMinimumStartDate()}
              onChange={onStartDatePickerChange}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              testID="endDateTimePicker"
              value={selectedEndDate}
              mode="date"
              display="default"
              minimumDate={getMinimumEndDate()} // Ngày kết thúc phải sau ngày bắt đầu ít nhất 1 ngày
              onChange={onEndDatePickerChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: responsiveWidth(18),
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: responsiveWidth(20),
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: responsiveFont(16),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: responsiveHeight(10),
    color: "#333",
  },
  dateInputContainer: {
    marginBottom: responsiveHeight(15),
  },
  dateLabel: {
    fontSize: responsiveFont(12),
    color: "#666",
    marginBottom: responsiveHeight(8),
    fontFamily: "Montserrat-Regular",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: responsiveWidth(12),
    backgroundColor: "#f9f9f9",
  },
  dateText: {
    fontSize: responsiveFont(13),
    color: "#333",
    fontFamily: "Montserrat-Regular",
  },
  helperText: {
    fontSize: responsiveFont(10),
    color: "#666",
    marginTop: responsiveHeight(3),
    fontStyle: "italic",
    fontFamily: "Montserrat-Regular",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: responsiveHeight(18),
    gap: responsiveWidth(10),
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  divider: { marginBottom: responsiveHeight(20) },
});

export default EditPhaseModal;
