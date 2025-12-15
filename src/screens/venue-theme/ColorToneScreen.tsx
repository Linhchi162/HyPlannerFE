import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import { ChevronLeft, Menu } from "lucide-react-native";
import { LayoutAnimation } from "react-native";
import { useNavigation } from "@react-navigation/native";
import LocationCard from "../../components/LocationCard";
import * as toneService from "../../service/toneService";
import type { ToneColorItem } from "../../service/toneService";
import apiClient from "../../api/client";
import * as userSelectionService from "../../service/userSelectionService";
import { useSelection } from "../../contexts/SelectionContext";
import CustomPopup from "../../components/CustomPopup";
import {
  useAlbumCreation,
  AlbumWizardStep,
} from "../../contexts/AlbumCreationContext";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
} from "../../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");

interface OptionItem {
  id: string;
  name: string;
  image: string;
}

type ToneType = "wedding" | "engagement";

const ColorToneScreen = () => {
  const navigation = useNavigation();
  const { nextStep, currentStep } = useAlbumCreation();
  const [selected, setSelected] = useState<string[]>([]);
  const [toneType, setToneType] = useState<ToneType>("wedding");
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<ToneColorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error" | "warning">(
    "warning"
  );
  const [popupTitle, setPopupTitle] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [popupButtonText, setPopupButtonText] = useState<string | undefined>(
    undefined
  );
  const [onPopupButtonPress, setOnPopupButtonPress] = useState<
    (() => void) | undefined
  >(undefined);

  const {
    toggleWeddingToneColor,
    toggleEngageToneColor,
    selectedWeddingToneColors,
    selectedEngageToneColors,
    clearSelections,
  } = useSelection();

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  const fetchData = async (type: ToneType) => {
    try {
      setLoading(true);
      const res =
        type === "wedding"
          ? await toneService.getWeddingToneColors()
          : await toneService.getEngageToneColors();
      setItems(res.data || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData(toneType);
  }, [toneType]);

  const handleProceedToNext = async () => {
    const totalSelected =
      selectedWeddingToneColors.length + selectedEngageToneColors.length;
    if (totalSelected === 0) return;
    try {
      setIsCreatingAlbum(true);
      setPopupType("warning");
      setPopupTitle("Đang lưu");
      setPopupMessage("Vui lòng đợi trong giây lát...");
      setPopupButtonText(undefined);
      setOnPopupButtonPress(undefined);
      setPopupVisible(true);

      // Luôn gửi cả hai mảng để giữ được lựa chọn từ cả hai tab
      await userSelectionService.createSelection(
        {
          weddingToneColorIds: Array.from(new Set(selectedWeddingToneColors)),
          engageToneColorIds: Array.from(new Set(selectedEngageToneColors)),
        },
        "tone-color"
      );

      // Tiến tới bước tiếp theo trong wizard
      if (currentStep === AlbumWizardStep.TONE_COLOR) {
        nextStep();
      }

      // Clear local selections
      setSelected([]);

      setPopupVisible(false);
      // Chuyển thẳng sang màn chọn trang phục lễ ăn hỏi cô dâu
      (navigation as any).navigate("BrideAoDaiStyle");
    } catch (e: any) {
      const msg =
        e?.message || e?.data?.message || "Không thể lưu lựa chọn tone màu";
      setPopupType("error");
      setPopupTitle("Thất bại");
      setPopupMessage(msg);
      setPopupButtonText("Đóng");
      setOnPopupButtonPress(undefined);
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    if (toneType === "wedding") {
      void toggleWeddingToneColor(id);
    } else {
      void toggleEngageToneColor(id);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tone màu</Text>
        <TouchableOpacity
          onPress={() => {
            if (!menuVisible) {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut
              );
            }
            setMenuVisible(!menuVisible);
          }}
        >
          <Menu size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Dropdown menu under header */}
      {menuVisible && (
        <View style={styles.menuWrapper}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[
                styles.menuItem,
                toneType === "wedding" && styles.menuItemActive,
              ]}
              onPress={() => {
                setToneType("wedding");
                setMenuVisible(false);
              }}
            >
              <Text
                style={[
                  styles.menuText,
                  toneType === "wedding" && styles.menuTextActive,
                ]}
              >
                Đám cưới
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.menuItem,
                toneType === "engagement" && styles.menuItemActive,
              ]}
              onPress={() => {
                setToneType("engagement");
                setMenuVisible(false);
              }}
            >
              <Text
                style={[
                  styles.menuText,
                  toneType === "engagement" && styles.menuTextActive,
                ]}
              >
                Lễ ăn hỏi
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Hãy chọn tone màu bạn mong muốn !
        </Text>
      </View>

      <FlatList
        key="color-tone-grid"
        data={loading ? [] : items}
        keyExtractor={(item) => (item as any)._id || (item as any).id}
        numColumns={3}
        renderItem={({ item }) => {
          const itemId = (item as any)._id || (item as any).id;
          return (
            <LocationCard
              id={itemId}
              name={(item as any).name}
              image={(item as any).image}
              isSelected={selected.includes(itemId)}
              onSelect={() => toggleSelection(itemId)}
            />
          );
        }}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
      />

      {/* Fixed Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            selected.length === 0 && styles.actionButtonDisabled,
          ]}
          onPress={handleProceedToNext}
          disabled={isCreatingAlbum || selected.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>
            {isCreatingAlbum ? "Đang lưu..." : "Tiếp theo"}
          </Text>
        </TouchableOpacity>
      </View>
      <CustomPopup
        visible={popupVisible}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        buttonText={popupButtonText}
        onButtonPress={onPopupButtonPress}
        onClose={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(20),
    height: responsiveHeight(72),
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(24),
    color: "#1f2937",
  },
  instructionContainer: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(16),
  },
  instructionText: {
    fontSize: responsiveFont(16),
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
  },
  menuWrapper: {
    position: "absolute",
    top:
      responsiveHeight(64) +
      (Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0),
    right: responsiveWidth(16),
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: "#FEF0F3",
    width: responsiveWidth(180),
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(8),
    gap: responsiveHeight(6),
  },
  menuItem: {
    backgroundColor: "#FEE5EE",
    borderRadius: responsiveWidth(10),
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(12),
  },
  menuItemActive: { backgroundColor: "#FFD4E3" },
  menuText: {
    color: "#1f2937",
    textAlign: "center",
    fontWeight: "500",
    fontSize: responsiveFont(14),
  },
  menuTextActive: { fontWeight: "700" },
  scrollContent: {
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(16),
    paddingBottom: responsiveHeight(100),
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: responsiveHeight(8),
  },
  actionButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingVertical: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(16),
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: "#F9CBD6",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(100),
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    width: "50%",
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonText: {
    color: "#000000",
    textAlign: "center",
    fontSize: responsiveFont(14),
    fontWeight: "600",
  },
  footerActionWrapper: {},
});

export default ColorToneScreen;
