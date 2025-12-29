import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Pressable,
} from "react-native";
import { Check } from "lucide-react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { fonts } from "../theme/fonts";
import {
  getItemWidth,
  getItemHeight,
} from "../../assets/styles/utils/responsive";

const { width } = Dimensions.get("window");

interface SimpleWeddingItemCardProps {
  id: string;
  name: string;
  image?: string;
  isSelected: boolean;
  onSelect: () => void;
  onPress?: () => void;
  showPinButton?: boolean;
}

const SimpleWeddingItemCard: React.FC<SimpleWeddingItemCardProps> = ({
  id,
  name,
  image,
  isSelected,
  onSelect,
  onPress,
  showPinButton = true,
}) => {
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
          resizeMode="cover"
          style={styles.image}
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
    marginBottom: 24,
    alignItems: "center",
  },
  imageContainer: {
    width: getItemWidth() - 12,
    height: getItemHeight(),
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
  },
  image: {
    width: getItemWidth() - 12,
    height: getItemHeight(),
    borderRadius: 8,
  },
  pinIconContainer: {
    position: "absolute",
    right: 3,
    top: getItemHeight() - 25,
    zIndex: 1,
  },
  pinButton: {
    width: 20,
    height: 20,
    backgroundColor: "#F9A8D4",
    borderRadius: 10,
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
    borderRadius: 10,
    padding: 4,
  },
  pinIcon: {
    transform: [{ rotate: "45deg" }],
  },
  itemName: {
    fontSize: 12,
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    textAlign: "center",
  },
});

export default SimpleWeddingItemCard;
