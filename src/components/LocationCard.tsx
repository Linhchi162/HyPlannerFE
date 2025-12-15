import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Check } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");

interface LocationCardProps {
  id: string;
  name: string;
  image: string;
  isSelected: boolean;
  onSelect: () => void;
  onPress?: () => void;
  showPinButton?: boolean;
}

const LocationCard: React.FC<LocationCardProps> = ({
  id,
  name,
  image,
  isSelected,
  onSelect,
  onPress,
  showPinButton = true,
}) => {
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

  const itemWidth = getItemWidth();
  const itemHeight = getItemHeight();

  const dynamicStyles = {
    itemContainer: { width: itemWidth },
    itemImage: { width: itemWidth - 12, height: itemHeight },
    pinPosition: { top: itemHeight - 45, right: responsiveWidth(3) },
  };

  return (
    <TouchableOpacity
      style={[styles.itemContainer, dynamicStyles.itemContainer]}
      onPress={onPress || onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={encodeURI(image)}
          style={[styles.itemImage, dynamicStyles.itemImage]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={0}
          placeholder={require("../../assets/images/default.png") as any}
          recyclingKey={id}
        />
        {showPinButton && (
          <View style={[styles.pinIconContainer, dynamicStyles.pinPosition]}>
            <Pressable
              style={[
                styles.pinButton,
                isSelected ? styles.pinButtonSelected : undefined,
              ]}
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
      <View style={styles.textContainer}>
        <Text style={styles.itemName} numberOfLines={2}>
          {name}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    marginBottom: responsiveHeight(8),
    alignItems: "center",
  },
  imageContainer: {
    position: "relative",
    borderRadius: responsiveWidth(8),
    overflow: "hidden",
    marginBottom: responsiveHeight(8),
  },
  itemImage: {
    borderRadius: responsiveWidth(8),
  },
  textContainer: {
    width: "100%",
    minHeight: responsiveHeight(30),

    justifyContent: "flex-start",
    alignItems: "center",
  },
  pinIconContainer: {
    position: "absolute",
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
    fontSize: responsiveFont(14),
    fontWeight: "500",
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 45,
    paddingTop: responsiveHeight(5),
  },
});

export default LocationCard;
