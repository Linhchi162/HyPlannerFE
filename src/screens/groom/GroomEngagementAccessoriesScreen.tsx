import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import CustomPopup from "../../components/CustomPopup";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../../theme/fonts";
import WeddingItemCard from "../../components/WeddingItemCard";
import * as groomEngageService from "../../service/groomEngageService";
import { Style } from "../../store/weddingCostume";
import {
  getGridGap,
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../../assets/styles/utils/responsive";
import { useSelection } from "../../contexts/SelectionContext";
import {
  useAlbumCreation,
  AlbumWizardStep,
} from "../../contexts/AlbumCreationContext";

const { width } = Dimensions.get("window");
const GAP = getGridGap();
const PADDING_HORIZONTAL = 32;
const ITEM_WIDTH = (width - PADDING_HORIZONTAL - GAP * 2) / 3;

export default function GroomEngagementAccessoriesScreen() {
  const navigation = useNavigation();
  const {
    nextStep,
    currentStep,
    isCreatingAlbum: isInWizard,
  } = useAlbumCreation();
  const [items, setItems] = useState<Style[]>([]);
  const {
    selectedGroomEngageAccessories,
    toggleGroomEngageAccessory,
    saveSelections,
    createAlbum,
  } = useSelection();
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupType, setPopupType] = useState<"success" | "error" | null>(null);
  const [popupMessage, setPopupMessage] = useState("");

  useEffect(() => {
    groomEngageService
      .getAllGroomEngageAccessories()
      .then((r) => setItems(r.data));
  }, []);

  const handleCreateAlbum = async () => {
    setIsCreatingAlbum(true);
    try {
      await saveSelections();
      nextStep();
      setIsCreatingAlbum(false);
      navigation.navigate("WeddingDress" as never);
    } catch (error) {
      setPopupType("error");
      setPopupMessage("Có lỗi xảy ra khi lưu lựa chọn");
      setIsCreatingAlbum(false);
    }
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lễ ăn hỏi - Phụ kiện</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {items.map((it) => (
            <View style={{ width: ITEM_WIDTH }} key={it._id}>
              <WeddingItemCard
                id={it._id}
                name={it.name}
                image={it.image}
                isSelected={selectedGroomEngageAccessories.includes(it._id)}
                onSelect={async () => await toggleGroomEngageAccessory(it._id)}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isCreatingAlbum && styles.actionButtonDisabled,
          ]}
          onPress={handleCreateAlbum}
          disabled={isCreatingAlbum}
        >
          <Text style={styles.actionButtonText}>
            {isCreatingAlbum ? "Đang lưu..." : "Chọn váy cưới"}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomPopup
        visible={popupType !== null}
        type={popupType || "success"}
        message={popupMessage}
        onClose={() => setPopupType(null)}
        title={""}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    padding: 4,
  },
  headerTitle: {
    fontSize: responsiveFont(16),
    fontFamily: "Agbalumo",
    color: "#1f2937",
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: responsiveHeight(100),
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: GAP,
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
  actionButtonText: {
    color: "#000",
    textAlign: "center",
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
  },
  actionButtonDisabled: { backgroundColor: "#E5E7EB", opacity: 0.6 },
});
