import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../theme/fonts";

const { width } = Dimensions.get("window");

export default function EngagementGroomMenu({
  visible,
  currentScreen,
  onClose,
}: {
  visible: boolean;
  currentScreen: string;
  onClose: () => void;
}) {
  const navigation = useNavigation();
  if (!visible) return null;
  const items = [
    { id: "outfit", title: "Trang phục", screen: "GroomEngagementOutfit" },
    { id: "acc", title: "Phụ kiện", screen: "GroomEngagementAccessories" },
  ];
  return (
    <View style={styles.menuWrapper}>
      <View style={styles.menuContainer}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.id}
            style={[
              styles.menuItem,
              currentScreen === it.screen && styles.menuItemActive,
            ]}
            onPress={() => {
              navigation.navigate(it.screen as never);
              onClose();
            }}
          >
            <Text
              style={[
                styles.menuText,
                currentScreen === it.screen && styles.menuTextActive,
              ]}
            >
              {it.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  menuWrapper: { position: "absolute", top: 80, right: 8, zIndex: 1000 },
  menuContainer: {
    backgroundColor: "#FEF0F3",
    width: width * 0.5,
    borderRadius: 16,
    padding: 8,
    gap: 6,
  },
  menuItem: {
    backgroundColor: "#FEE5EE",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  menuItemActive: { backgroundColor: "#FFD4E3" },
  menuText: {
    fontFamily: fonts.montserratMedium,
    color: "#1f2937",
    textAlign: "center",
  },
  menuTextActive: { fontFamily: fonts.montserratSemiBold },
});
