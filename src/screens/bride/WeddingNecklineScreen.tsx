import React, { useState, useEffect } from "react";
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
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import WeddingItemCard from "../../components/WeddingItemCard";
import { fonts } from "../../theme/fonts";
import * as weddingCostumeService from "../../service/weddingCostumeService";
import { Style } from "../../store/weddingCostume";
import { useSelection } from "../../contexts/SelectionContext";
import {
  useAlbumCreation,
  AlbumWizardStep,
} from "../../contexts/AlbumCreationContext";
import {
  getGridGap,
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");
const GAP = getGridGap();
const PADDING_HORIZONTAL = 32;
const ITEM_WIDTH = (width - PADDING_HORIZONTAL - GAP * 2) / 3;

const WeddingNecklineScreen = () => {
  const navigation = useNavigation();
  const {
    nextStep,
    currentStep,
    isCreatingAlbum: isInWizard,
  } = useAlbumCreation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [necklines, setNecklines] = useState<Style[]>([]);
  const { selectedNecklines, toggleNecklineSelection, saveSelections } =
    useSelection();

  useEffect(() => {
    const fetchNecklines = async () => {
      setIsLoading(true);
      try {
        const response = await weddingCostumeService.getAllNecklines();
        setNecklines(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra khi tải dữ liệu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNecklines();
  }, []);

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Váy cưới - Cổ áo</Text>
      </View>

      {/* Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.necklineGrid}>
            {necklines.map((item) => (
              <View style={{ width: ITEM_WIDTH }} key={item._id}>
                <WeddingItemCard
                  id={item._id}
                  name={item.name}
                  image={item.image}
                  isSelected={selectedNecklines.includes(item._id)}
                  onSelect={async () => await toggleNecklineSelection(item._id)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            await saveSelections();
            if (
              isInWizard &&
              currentStep === AlbumWizardStep.WEDDING_NECKLINE
            ) {
              nextStep();
            }
            navigation.navigate("WeddingDetail" as never);
          }}
        >
          <Text style={styles.actionButtonText}>Chọn chi tiết trang trí</Text>
          <ChevronLeft
            size={16}
            color="#000000"
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    backgroundColor: "#fff",
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    fontFamily: fonts.montserratMedium,
  },
  scrollContent: {
    paddingBottom: responsiveHeight(100),
  },
  necklineGrid: {
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
    flexDirection: "row",
  },
  actionButtonText: {
    color: "#000000",
    textAlign: "center",
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    marginRight: 4,
  },
});

export default WeddingNecklineScreen;
