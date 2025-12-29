import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
} from "react-native";
import { ChevronLeft, Heart } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { fonts } from "../../theme/fonts";
// import removed: CustomPopup

const { width, height } = Dimensions.get("window");

const RoleSelectionScreen = () => {
  const navigation = useNavigation();
  // popup removed

  const handleBrideSelection = () => {
    // If coming from engagement, navigate to Ao Dai; default to wedding dress
    // @ts-ignore reading optional route param
    const from: string | undefined = (navigation as any)
      ?.getState?.()
      ?.routes?.slice(-1)[0]?.params?.from;
    if (from === "engagement") {
      navigation.navigate("BrideAoDaiStyle" as never);
    } else {
      navigation.navigate("WeddingDress" as never);
    }
  };

  const handleGroomSelection = () => {
    // If coming from engagement, navigate to engagement outfit; default to groom suit
    // @ts-ignore
    const from: string | undefined = (navigation as any)
      ?.getState?.()
      ?.routes?.slice(-1)[0]?.params?.from;
    if (from === "engagement") {
      navigation.navigate("GroomEngagementOutfit" as never);
    } else {
      navigation.navigate("GroomSuit" as never);
    }
  };

  // popup close removed

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={32} color="#1f2937" />
        </TouchableOpacity>
      </View>
      {/* Separator Line */}
      <View style={styles.separator} />
      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Bạn là</Text>
        </View>

        {/* Selection Cards */}
        <View style={styles.cardsContainer}>
          {/* Bride Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleBrideSelection}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <View style={styles.brideIcon}>
                <Image
                  source={require("../../../assets/images/bride-icon.png")}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.cardTitle}>Cô dâu</Text>
          </TouchableOpacity>

          {/* Groom Card */}
          <TouchableOpacity
            style={styles.card}
            onPress={handleGroomSelection}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <View style={styles.groomIcon}>
                <Image
                  source={require("../../../assets/images/groom-icon.png")}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.cardTitle}>Chú rể</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Hearts */}
      <View style={styles.footer}>
        <Heart size={12} color="#F9CBD6" fill="#F9CBD6" />
        <Heart size={12} color="#F9CBD6" fill="#F9CBD6" />
        <Heart size={12} color="#F9CBD6" fill="#F9CBD6" />
      </View>
      {/* Popup removed - direct navigate to GroomSuit */}
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
    paddingHorizontal: 16,
    paddingVertical: 50,
    height: 64,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  title: {
    fontSize: 48,
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  cardsContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 32,
  },
  card: {
    width: width * 0.8,
    height: 280,
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 20,
  },
  brideIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#FDF2F8",
    justifyContent: "center",
    alignItems: "center",
  },
  groomIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  iconImage: {
    width: 80,
    height: 80,
  },
  cardTitle: {
    fontSize: 36,
    fontFamily: fonts.montserratSemiBold,
    color: "#1f2937",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingBottom: 100,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 0,
  },
});

export default RoleSelectionScreen;
