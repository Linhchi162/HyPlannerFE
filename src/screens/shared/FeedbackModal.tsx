import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  Portal,
  Dialog,
  TextInput,
  Button,
  Text,
  ActivityIndicator,
  Icon,
  Divider,
} from "react-native-paper";
import { useSelector } from "react-redux";
import { createFeedback, editFeedback } from "../../service/feedbackService";
import { selectCurrentUser } from "../../store/authSlice";
import { Feedback } from "../../store/feedbackSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import logger from "../../utils/logger";

type FeedbackDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  existingFeedback?: Feedback;
};

const COLORS = {
  primary: "#F2C4CE",
  iconColor: "#D8707E",
  starActive: "#FFD700",
  starInactive: "#C0C0C0",
  textPrimary: "#1F2024",
  success: "#4BB543",
};

const FeedbackModal: React.FC<FeedbackDialogProps> = ({
  visible,
  onDismiss,
  existingFeedback,
}) => {
  const [star, setStar] = useState(0);
  const [content, setContent] = useState("");
  const isLoading = useSelector(
    (state: any) => state.feedback.createFeedback.isLoading
  );
  const user = useAppSelector(selectCurrentUser);
  const userId = user.id || user._id;
  const dispatch = useAppDispatch();
  const [showSuccess, setShowSuccess] = useState(false);

  // Xóa state khi dialog bị đóng
  const handleDismiss = () => {
    if (isLoading) return;
    setShowSuccess(false);
    onDismiss();
  };

  useEffect(() => {
    // Chỉ chạy khi dialog mở ra
    if (visible) {
      if (existingFeedback) {
        // Edit Mode: Điền thông tin cũ
        setStar(existingFeedback.star);
        setContent(existingFeedback.content);
      } else {
        // Create Mode: Reset form
        setStar(0);
        setContent("");
      }
      setShowSuccess(false); // Luôn ẩn màn hình success khi mới mở
    }
  }, [visible, existingFeedback]);

  const handleSubmit = () => {
    if (star === 0 || !content) return;
    if (!userId) {
      logger.error("User ID is missing in FeedbackModal");
      return;
    }

    const feedbackData = {
      star: star,
      content: content,
    };
    // Quyết định gọi service nào:
    const serviceToCall = existingFeedback ? editFeedback : createFeedback;
    // Gọi service trực tiếp từ dialog
    serviceToCall(userId, feedbackData, dispatch).then(() => {
      // Sau khi submit, tự động đóng dialog
      setShowSuccess(true); // 1. Hiển thị màn hình cảm ơn
      // 2. Tự động đóng dialog sau 2 giây
      setTimeout(() => {
        handleDismiss();
      }, 2000);
    });
  };

  // Reset state khi dialog được đóng (từ bên ngoài, sau khi submit)
  useEffect(() => {
    if (!visible) {
      setStar(0);
      setContent("");
    }
  }, [visible]);

  // Xác định các chuỗi văn bản dựa trên mode
  const isEditMode = !!existingFeedback;
  const title = showSuccess
    ? "Cảm ơn bạn!"
    : isEditMode
    ? "Chỉnh sửa phản hồi"
    : "Gửi phản hồi của bạn";
  const submitButtonText = isEditMode ? "Cập nhật" : "Gửi";
  const successText = isEditMode
    ? "Đã cập nhật phản hồi."
    : "Phản hồi của bạn đã được gửi.";

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={handleDismiss} style={styles.dialog}>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          {showSuccess ? (
            <View style={styles.successContainer}>
              <Icon
                source="check-circle-outline"
                size={56}
                color={COLORS.success}
              />
              <Text style={styles.successText}>{successText}</Text>
            </View>
          ) : (
            <>
              <Divider />
              <Text style={styles.label}>
                Bạn đánh giá ứng dụng này thế nào?
              </Text>
              <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStar(s)}
                    disabled={isLoading}
                  >
                    <Icon
                      source={s <= star ? "star" : "star-outline"}
                      size={32}
                      color={
                        s <= star ? COLORS.starActive : COLORS.starInactive
                      }
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Nội dung phản hồi:</Text>
              <TextInput
                label="Chia sẻ cảm nhận của bạn..."
                value={content}
                onChangeText={setContent}
                multiline
                numberOfLines={4}
                style={styles.textInput}
                disabled={isLoading}
                mode="outlined"
                outlineColor="#DDD"
                activeOutlineColor={COLORS.iconColor}
              />
            </>
          )}
        </Dialog.Content>
        {/* ----- ẨN NÚT KHI HIỆN THÔNG BÁO THÀNH CÔNG ----- */}
        {!showSuccess && (
          <Dialog.Actions style={styles.actions}>
            <Button
              onPress={handleDismiss}
              disabled={isLoading}
              textColor={COLORS.textPrimary}
              style={{ paddingHorizontal: responsiveWidth(12) }}
            >
              Hủy
            </Button>
            <Button
              onPress={handleSubmit}
              loading={isLoading}
              disabled={star === 0 || !content || isLoading}
              mode="contained"
              buttonColor={COLORS.iconColor}
              style={{ paddingHorizontal: responsiveWidth(12) }}
            >
              {submitButtonText}
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontFamily: "Montserrat-SemiBold",
    color: COLORS.textPrimary,
    fontSize: responsiveFont(15),
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: COLORS.textPrimary,
    marginBottom: responsiveHeight(12),
    marginTop: responsiveHeight(8),
  },
  starContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(18),
  },
  textInput: {
    backgroundColor: "#F9F9F9",
    maxHeight: 220,
    minHeight: 200,
    textAlignVertical: "top",
  },
  actions: {
    paddingBottom: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(16),
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(24),
  },
  successText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: COLORS.textPrimary,
    marginTop: responsiveHeight(12),
    textAlign: "center",
  },
});

export default FeedbackModal;
