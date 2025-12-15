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

const { width } = Dimensions.get("window");
const GAP = getGridGap();
const PADDING_HORIZONTAL = 32;
const ITEM_WIDTH = (width - PADDING_HORIZONTAL - GAP * 2) / 3;

export default function GroomEngagementOutfitScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Style[]>([]);
  const {
    selectedGroomEngageOutfits,
    toggleGroomEngageOutfit,
    saveSelections,
  } = useSelection();

  useEffect(() => {
    groomEngageService
      .getAllGroomEngageOutfits()
      .then((r) => setItems(r.data))
      .catch((error) => {});
  }, []);

  const renderDressItem = (item: Style) => {
    return (
      <View style={{ width: ITEM_WIDTH }} key={item._id}>
        <WeddingItemCard
          id={item._id}
          name={item.name}
          image={item.image}
          isSelected={selectedGroomEngageOutfits.includes(item._id)}
          onSelect={async () => await toggleGroomEngageOutfit(item._id)}
        />
      </View>
    );
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

        <Text style={styles.headerTitle}>Lễ ăn hỏi - Trang phục</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.dressGrid}>{items.map(renderDressItem)}</View>
      </ScrollView>

      <View style={styles.actionButtonContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={async () => {
            await saveSelections();
            navigation.navigate("GroomEngagementAccessories" as never);
          }}
        >
          <Text style={styles.actionButtonText}>Chọn phụ kiện</Text>
          <ChevronLeft
            size={16}
            color="#000000"
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
      </View>
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
  dressGrid: {
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
