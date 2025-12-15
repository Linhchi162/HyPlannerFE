import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CheckCircle } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import {
  useAlbumCreation,
  AlbumWizardStep,
} from "../../contexts/AlbumCreationContext";
import { useSelection } from "../../contexts/SelectionContext";
import CreateAlbumModal from "./CreateAlbumModal";
import * as userSelectionService from "../../service/userSelectionService";
import * as albumService from "../../service/albumService";
import { fonts } from "../../theme/fonts";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
  borderRadius,
} from "../../../assets/styles/utils/responsive";

const AlbumWizardCompleteScreen = () => {
  const navigation = useNavigation();
  const { resetAlbumCreation, currentStep } = useAlbumCreation();
  const { saveSelections } = useSelection();
  const [isCreating, setIsCreating] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  const handleShowMetadataModal = () => {
    setShowMetadataModal(true);
  };

  const handleCompleteAlbum = async (
    name: string,
    authorName?: string,
    coverImage?: string
  ) => {
    try {
      setIsCreating(true);

      // Save any pending selections first
      await saveSelections();
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Lấy tất cả selections hiện tại
      const response = await userSelectionService.getUserSelections();
      const selections = response?.data || [];

      // Lấy tất cả các selection IDs (không chỉ lấy isPinned)
      const selectionIds = selections
        .filter((sel: any) => sel._id) // Đảm bảo có _id
        .map((sel: any) => sel._id);

      if (selectionIds.length === 0) {
        throw new Error("Không có selections nào để tạo album");
      }

      // Tạo album với metadata và selections
      const createdAlbum = await albumService.createAlbum({
        name,
        authorName: authorName || "",
        coverImage: coverImage || "",
        selections: selectionIds, // Gửi tất cả selection IDs
        isPublic: false,
      });

      setIsCreating(false);
      setShowMetadataModal(false);

      // Reset navigation stack and go to Album screen
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "Main", params: { screen: "Album" } }],
      });

      Alert.alert("Thành công", "Đã tạo album thành công với tất cả lựa chọn!");

      // Reset album creation context
      resetAlbumCreation();
    } catch (error: any) {
      console.error("Error creating album:", error);
      setIsCreating(false);
      Alert.alert(
        "Lỗi",
        error.message || "Không thể tạo album. Vui lòng thử lại.",
        [
          {
            text: "Đóng",
            onPress: () => setShowMetadataModal(false),
          },
        ]
      );
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Hủy tạo album",
      "Bạn có chắc muốn hủy? Tất cả lựa chọn sẽ bị mất.",
      [
        { text: "Tiếp tục tạo", style: "cancel" },
        {
          text: "Hủy",
          style: "destructive",
          onPress: () => {
            resetAlbumCreation();
            (navigation as any).navigate("Main", { screen: "Home" });
          },
        },
      ]
    );
  };

  const getStepName = (step: AlbumWizardStep): string => {
    switch (step) {
      case AlbumWizardStep.LOCATION:
        return "Địa điểm";
      case AlbumWizardStep.STYLE:
        return "Phong cách";
      case AlbumWizardStep.TONE_COLOR:
        return "Tone màu";
      case AlbumWizardStep.BRIDE_AODAI_STYLE:
        return "Áo dài cô dâu - Kiểu dáng";
      case AlbumWizardStep.BRIDE_AODAI_MATERIAL:
        return "Áo dài cô dâu - Chất liệu";
      case AlbumWizardStep.BRIDE_AODAI_PATTERN:
        return "Áo dài cô dâu - Hoa văn";
      case AlbumWizardStep.BRIDE_HEADSCARF:
        return "Áo dài cô dâu - Khăn đội đầu";
      case AlbumWizardStep.GROOM_ENGAGE_OUTFIT:
        return "Lễ ăn hỏi - Trang phục chú rể";
      case AlbumWizardStep.GROOM_ENGAGE_ACCESS:
        return "Lễ ăn hỏi - Phụ kiện chú rể";
      case AlbumWizardStep.WEDDING_DRESS:
        return "Váy cưới - Kiểu dáng";
      case AlbumWizardStep.WEDDING_MATERIAL:
        return "Váy cưới - Chất liệu";
      case AlbumWizardStep.WEDDING_DETAIL:
        return "Váy cưới - Chi tiết";
      case AlbumWizardStep.WEDDING_NECKLINE:
        return "Váy cưới - Cổ áo";
      case AlbumWizardStep.ACCESSORIES_VEIL:
        return "Phụ kiện - Voan";
      case AlbumWizardStep.ACCESSORIES_JEWELRY:
        return "Phụ kiện - Trang sức";
      case AlbumWizardStep.ACCESSORIES_CROWN:
        return "Phụ kiện - Vương miện";
      case AlbumWizardStep.ACCESSORIES_HAIRCLIP:
        return "Phụ kiện - Kẹp tóc";
      case AlbumWizardStep.WEDDING_FLOWERS:
        return "Hoa cưới";
      case AlbumWizardStep.GROOM_SUIT:
        return "Vest chú rể - Kiểu dáng";
      case AlbumWizardStep.GROOM_MATERIAL:
        return "Vest chú rể - Chất liệu";
      case AlbumWizardStep.GROOM_COLOR:
        return "Vest chú rể - Màu sắc";
      case AlbumWizardStep.GROOM_LAPEL:
        return "Vest chú rể - Ve áo";
      case AlbumWizardStep.GROOM_POCKET:
        return "Vest chú rể - Túi áo";
      case AlbumWizardStep.GROOM_DECOR:
        return "Vest chú rể - Trang trí";
      default:
        return "";
    }
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <CheckCircle size={80} color="#10B981" />
          </View>

          <Text style={styles.title}>Hoàn tất quy trình!</Text>
          <Text style={styles.subtitle}>
            Bạn đã hoàn thành tất cả các bước chọn lựa
          </Text>

          <View style={styles.stepsContainer}>
            {[
              AlbumWizardStep.LOCATION,
              AlbumWizardStep.STYLE,
              AlbumWizardStep.TONE_COLOR,
              AlbumWizardStep.BRIDE_AODAI_STYLE,
              AlbumWizardStep.BRIDE_AODAI_MATERIAL,
              AlbumWizardStep.BRIDE_AODAI_PATTERN,
              AlbumWizardStep.BRIDE_HEADSCARF,
              AlbumWizardStep.GROOM_ENGAGE_OUTFIT,
              AlbumWizardStep.GROOM_ENGAGE_ACCESS,
              AlbumWizardStep.WEDDING_DRESS,
              AlbumWizardStep.WEDDING_MATERIAL,
              AlbumWizardStep.WEDDING_NECKLINE,
              AlbumWizardStep.WEDDING_DETAIL,
              AlbumWizardStep.ACCESSORIES_VEIL,
              AlbumWizardStep.ACCESSORIES_JEWELRY,
              AlbumWizardStep.ACCESSORIES_CROWN,
              AlbumWizardStep.ACCESSORIES_HAIRCLIP,
              AlbumWizardStep.WEDDING_FLOWERS,
              AlbumWizardStep.GROOM_SUIT,
              AlbumWizardStep.GROOM_MATERIAL,
              AlbumWizardStep.GROOM_COLOR,
              AlbumWizardStep.GROOM_LAPEL,
              AlbumWizardStep.GROOM_POCKET,
              AlbumWizardStep.GROOM_DECOR,
            ].map((step) => (
              <View key={step} style={styles.stepItem}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.stepText}>{getStepName(step)}</Text>
              </View>
            ))}
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={handleShowMetadataModal}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Hoàn thành</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleCancel}
              disabled={isCreating}
            >
              <Text style={styles.secondaryButtonText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <CreateAlbumModal
        visible={showMetadataModal}
        onClose={() => setShowMetadataModal(false)}
        onCreated={handleCompleteAlbum}
        initialName={`Album ${new Date().getTime()}`}
        isEdit={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: responsiveWidth(24),
    paddingVertical: responsiveHeight(24),
  },
  content: {
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: responsiveHeight(24),
  },
  title: {
    fontSize: responsiveFont(28),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
    marginBottom: responsiveHeight(8),
    textAlign: "center",
  },
  subtitle: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginBottom: responsiveHeight(32),
    textAlign: "center",
  },
  stepsContainer: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: responsiveHeight(32),
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(12),
  },
  stepText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    marginLeft: responsiveWidth(12),
  },
  actionContainer: {
    width: "100%",
  },
  button: {
    width: "100%",
    paddingVertical: responsiveHeight(14),
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: responsiveHeight(12),
  },
  primaryButton: {
    backgroundColor: "#F9CBD6",
  },
  primaryButtonText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    fontSize: responsiveFont(16),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
  },
});

export default AlbumWizardCompleteScreen;
