import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { fonts } from "../theme/fonts";
import {
  getItemWidth,
  getItemHeight,
  getGridGap,
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");

interface WeddingItemCardProps {
  id: string;
  name: string;
  image?: string;
  isSelected: boolean;
  onSelect: () => void;
  onPress?: () => void;
  showPinButton?: boolean;
}

const WeddingItemCard: React.FC<WeddingItemCardProps> = ({
  id,
  name,
  image,
  isSelected,
  onSelect,
  onPress,
  showPinButton = true,
}) => {
  // Loại bỏ state management để tối ưu performance

  return (
    <TouchableOpacity
      key={id}
      style={styles.itemContainer}
      onPress={onPress || onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={
            image ? { uri: image } : require("../../assets/images/default.png")
          }
          style={styles.image}
          contentFit="cover"
          transition={0}
          cachePolicy="memory-disk"
          placeholder={require("../../assets/images/default.png") as any}
          recyclingKey={id}
        />
        {showPinButton && (
          <View style={styles.pinIconContainer}>
            <Pressable
              style={[styles.pinButton, isSelected && styles.pinButtonSelected]}
              onPress={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              {isSelected ? (
                <Check size={12} color="#E07181" style={styles.checkIcon} />
              ) : (
                <FontAwesome5
                  name="thumbtack"
                  size={12}
                  color="#ffffff"
                  style={styles.pinIcon}
                />
              )}
            </Pressable>
          </View>
        )}
      </View>
      <Text style={styles.itemName} numberOfLines={2}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    width: getItemWidth(),
    marginBottom: responsiveHeight(24),
    alignItems: "center",
  },
  imageContainer: {
    width: getItemWidth() - responsiveWidth(12),
    height: getItemHeight(),
    position: "relative",
    borderRadius: responsiveWidth(8),
    overflow: "hidden",
    marginBottom: responsiveHeight(8),
  },
  image: {
    width: getItemWidth() - responsiveWidth(12),
    height: getItemHeight(),
    borderRadius: responsiveWidth(8),
  },
  pinIconContainer: {
    position: "absolute",
    right: responsiveWidth(4),
    bottom: responsiveHeight(6),
    zIndex: 1,
  },
  pinButton: {
    width: responsiveWidth(20),
    height: responsiveWidth(20),
    backgroundColor: "#F9A8D4",
    borderRadius: responsiveWidth(10),
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  pinButtonSelected: {
    backgroundColor: "#ffffff",
  },
  checkIcon: {
    backgroundColor: "#fff",
    borderRadius: responsiveWidth(10),
    padding: responsiveWidth(4),
  },
  pinIcon: {
    transform: [{ rotate: "45deg" }],
  },
  itemName: {
    fontSize: responsiveFont(12),
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    textAlign: "center",
  },
});

export default React.memo(WeddingItemCard);
