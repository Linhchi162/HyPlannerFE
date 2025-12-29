import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { Plus } from "lucide-react-native";
import { fonts } from "../theme/fonts";

const { width } = Dimensions.get("window");
const DEFAULT_ALBUM_IMAGE_URL =
  "https://www.brides.com/thmb/fZBzhWRjH5ZaCgOqjO7kc1ZJEsQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/recirc-texas-garden-glass-tent-wedding-couple-portrait-jose-villa-0924-cbc6f4f2a3c04ed59c464413e1fbc785.JPG";
const CARD_WIDTH = (width - 80) / 2; // 2 columns with 16px padding on each side and 16px gap
const CARD_HEIGHT = CARD_WIDTH * 0.8; // Make height 80% of width to reduce size

// Ensure consistent measurement when layout changes; if parent padding/gap differs on some screens,
// we can clamp a minimum width to avoid rounding shrink issues
const MIN_CARD_WIDTH = 40;
const MIN_CARD_HEIGHT = MIN_CARD_WIDTH * 0.8;

interface AlbumCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  authorName?: string;
  isAddNew?: boolean;
  onPress: () => void;
  cardWidth?: number;
}

// ✅ OPTIMIZED: Wrap with React.memo to prevent unnecessary re-renders
const AlbumCardComponent: React.FC<AlbumCardProps> = ({
  title,
  imageUrl,
  authorName,
  isAddNew,
  onPress,
  cardWidth,
}) => {
  const actualWidth = cardWidth || CARD_WIDTH;
  const actualHeight = actualWidth * 0.8;
  if (isAddNew) {
    return (
      <TouchableOpacity
        style={[
          styles.addNewContainer,
          { width: actualWidth, height: actualHeight },
        ]}
        onPress={onPress}
      >
        <Plus size={24} color="#9ca3af" />
        <Text style={styles.addNewText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.container, { width: actualWidth, height: actualHeight }]}
      onPress={onPress}
    >
      <Image
        source={imageUrl ? imageUrl : DEFAULT_ALBUM_IMAGE_URL}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        placeholder={require("../../assets/images/default.png") as any}
      />
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {authorName && (
          <Text style={styles.authorName} numberOfLines={1}>
            {authorName}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minWidth: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    height: Math.max(CARD_HEIGHT, MIN_CARD_HEIGHT),
    minHeight: Math.max(CARD_HEIGHT, MIN_CARD_HEIGHT),
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewContainer: {
    width: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minWidth: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    height: Math.max(CARD_HEIGHT, MIN_CARD_HEIGHT),
    minHeight: Math.max(CARD_HEIGHT, MIN_CARD_HEIGHT),
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  titleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.montserratSemiBold,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 4,
  },
  authorName: {
    fontSize: 12,
    fontFamily: fonts.montserratMedium,
    color: "#e5e7eb",
    textAlign: "center",
  },
  addNewText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: fonts.montserratMedium,
    color: "#6b7280",
  },
});

// ✅ OPTIMIZED: Export memoized component to prevent unnecessary re-renders
export default React.memo(AlbumCardComponent);
