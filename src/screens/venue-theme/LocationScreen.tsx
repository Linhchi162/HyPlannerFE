import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  Image,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import LocationCard from "../../components/LocationCard";
import * as venueThemeService from "../../service/venueThemeService";
import * as userSelectionService from "../../service/userSelectionService";
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

interface LocationOption {
  id: string;
  name: string;
  image: string;
}

const LocationScreen = () => {
  const navigation = useNavigation();
  const { startAlbumCreation, nextStep, currentStep, isCreatingAlbum } =
    useAlbumCreation();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
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

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await venueThemeService.getWeddingVenues();
        setLocationOptions(
          res.data.map((v) => ({ id: v._id, name: v.name, image: v.image }))
        );
      } catch {}
    })();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedLocations((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getItemWidth = () => {
    const paddingHorizontal = 32; // 16px on each side
    const gap = 8;
    const availableWidth = width - paddingHorizontal;
    const totalGapWidth = gap * 2; // 2 gaps between 3 items
    return (availableWidth - totalGapWidth) / 3;
  };

  const getItemHeight = () => {
    return getItemWidth(); // Square aspect ratio
  };

  const renderLocationItem = (item: LocationOption) => {
    const isSelected = selectedLocations.includes(item.id);

    return (
      <LocationCard
        key={item.id}
        id={item.id}
        name={item.name}
        image={item.image}
        isSelected={isSelected}
        onSelect={() => toggleSelection(item.id)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa điểm</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Instruction Text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Hãy chọn địa điểm bạn mong muốn !
        </Text>
      </View>

      {/* Location Grid */}
      <FlatList
        data={locationOptions}
        keyExtractor={(item) => item.id}
        numColumns={3}
        renderItem={({ item }) => renderLocationItem(item)}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.scrollContent}
      />

      {/* Fixed Action Button */}
      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            selectedLocations.length === 0 && styles.actionButtonDisabled,
          ]}
          onPress={async () => {
            if (selectedLocations.length === 0) return;
            try {
              setPopupType("warning");
              setPopupTitle("Đang lưu");
              setPopupMessage("Vui lòng đợi trong giây lát...");
              setPopupButtonText(undefined);
              setOnPopupButtonPress(undefined);
              setPopupVisible(true);

              // Lưu selection địa điểm
              await userSelectionService.createSelection(
                { weddingVenueIds: Array.from(new Set(selectedLocations)) },
                "wedding-venue"
              );

              // Bắt đầu flow tạo album nếu chưa bắt đầu
              if (
                !isCreatingAlbum ||
                currentStep === AlbumWizardStep.NOT_STARTED
              ) {
                startAlbumCreation();
              }

              // Tiến tới bước tiếp theo trong wizard (LOCATION -> STYLE)
              if (currentStep === AlbumWizardStep.LOCATION) {
                nextStep();
              }

              setPopupVisible(false);
              // Chuyển sang màn chọn phong cách
              (navigation as any).navigate("Style");
            } catch (e: any) {
              setPopupType("error");
              setPopupTitle("Thất bại");
              const msg =
                e?.message ||
                e?.data?.message ||
                "Không thể lưu lựa chọn địa điểm.";
              setPopupMessage(msg);
              setPopupButtonText("Đóng");
              setOnPopupButtonPress(undefined);
            }
          }}
          disabled={selectedLocations.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Tiếp theo</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
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
    fontWeight: "600",
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
});

export default LocationScreen;
