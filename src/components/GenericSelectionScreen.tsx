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
} from "react-native";
import { ChevronLeft, Menu } from "lucide-react-native";
import { LayoutAnimation } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../theme/fonts";
import WeddingItemCard from "./WeddingItemCard";
import {
  getGridGap,
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
  spacing,
} from "../../assets/styles/utils/responsive";

interface GenericItem {
  _id: string;
  name: string;
  image: string;
}

interface GenericSelectionScreenProps {
  // Display config
  headerTitle: string;
  headerSubtitle: string;
  actionButtonText: string;
  headerBackgroundColor?: string;

  // Menu component (optional)
  MenuComponent?: React.ComponentType<{
    visible: boolean;
    currentScreen: string;
    onClose: () => void;
  }>;
  currentScreenName?: string;

  // Data fetching
  fetchItems: () => Promise<{ data: GenericItem[] }>;

  // Selection state from context
  selectedItems: string[];
  onToggleItem: (id: string) => void | Promise<void>;
  onSaveSelections?: () => Promise<void>;

  // Navigation
  nextScreen: string;
  onBackPress?: () => void;
}

const GenericSelectionScreen: React.FC<GenericSelectionScreenProps> = ({
  headerTitle,
  headerSubtitle,
  actionButtonText,
  headerBackgroundColor = "#FEF0F3",
  MenuComponent,
  currentScreenName,
  fetchItems,
  selectedItems,
  onToggleItem,
  onSaveSelections,
  nextScreen,
  onBackPress,
}) => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<GenericItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems()
      .then((response) => {
        setItems(response.data);
      })
      .catch((error) => {
        console.log("Error fetching items:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleActionPress = async () => {
    if (onSaveSelections) {
      await onSaveSelections();
    }
    navigation.navigate(nextScreen as never);
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const topPad =
    Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBackgroundColor }]}>
        <TouchableOpacity onPress={handleBackPress}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <Text style={styles.headerSubtitle}>{headerSubtitle}</Text>
        </View>
        {MenuComponent ? (
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
            <Menu size={24} color="#1f2937" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
      </View>

      {/* Menu (if provided) */}
      {MenuComponent && currentScreenName && (
        <MenuComponent
          visible={menuVisible}
          currentScreen={currentScreenName}
          onClose={() => setMenuVisible(false)}
        />
      )}

      {/* Items Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {items.map((item) => (
            <WeddingItemCard
              key={item._id}
              id={item._id}
              name={item.name}
              image={item.image}
              isSelected={selectedItems.includes(item._id)}
              onSelect={async () => await onToggleItem(item._id)}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleActionPress}
        >
          <Text style={styles.actionButtonText}>{actionButtonText}</Text>
          <ChevronLeft
            size={16}
            color="#000000"
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(16),
    height: responsiveHeight(64),
  },
  headerTitleContainer: { alignItems: "center" },
  headerTitle: {
    fontSize: responsiveFont(20),
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
    marginTop: spacing.xs / 2,
  },
  scrollContent: { paddingBottom: responsiveHeight(24) },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(16),
    gap: getGridGap(),
  },
  actionButton: {
    backgroundColor: "#F9CBD6",
    paddingVertical: spacing.sm,
    paddingHorizontal: responsiveWidth(16),
    borderRadius: responsiveWidth(100),
    marginTop: responsiveHeight(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  actionButtonText: {
    color: "#000000",
    textAlign: "center",
    fontSize: responsiveFont(14),
    fontFamily: fonts.montserratSemiBold,
    marginRight: spacing.xs,
  },
});

export default GenericSelectionScreen;
