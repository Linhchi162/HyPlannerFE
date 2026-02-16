import React, { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { RootStackParamList } from "../../navigation/types";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  responsiveWidth,
  responsiveHeight,
} from "../../../assets/styles/utils/responsive";

export default function BeginScreen() {
  const insets = useSafeAreaInsets();
  const [isPressed, setIsPressed] = useState(false);
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();

  const handleStartPress = () => {
    navigation.navigate("Login");
  };

  const patternImg = useMemo(
    () => require("../../../assets/images/pattern.png"),
    []
  );
  const coupleImg = useMemo(
    () => require("../../../assets/images/couple.png"),
    []
  );
  const phraseImg = useMemo(
    () => require("../../../assets/images/phrase.png"),
    []
  );
  const startBtnImg = useMemo(
    () => require("../../../assets/images/startButton.png"),
    []
  );

  const sizes = useMemo(() => {
    // Aspect ratios based on your assets:
    // pattern: 1024x512 (2:1), couple: 768x1035, phrase: 1024x237, button: ~1200x214
    const patternAspect = 1024 / 512;
    const coupleAspect = 768 / 1035;
    const phraseAspect = 1024 / 237;
    const buttonAspect = 1200 / 214;

    const contentMaxWidth = Math.min(windowWidth, responsiveWidth(520));
    const baseWidth = Math.min(contentMaxWidth * 1, windowWidth * 1.5);

    const patternHeight = windowWidth / patternAspect; // full-bleed across screen

    const coupleWidth = Math.min(baseWidth, responsiveWidth(460));
    const coupleHeight = Math.min(
      coupleWidth / coupleAspect,
      windowHeight * 0.59
    );

    const phraseWidth = Math.min(baseWidth, responsiveWidth(440));
    const phraseHeight = Math.min(
      phraseWidth / phraseAspect,
      windowHeight * 0.14
    );

    const buttonWidth = Math.min(baseWidth, responsiveWidth(460));
    const buttonHeight = Math.min(
      buttonWidth / buttonAspect,
      windowHeight * 0.12
    );

    return {
      patternHeight,
      coupleWidth,
      coupleHeight,
      phraseWidth,
      phraseHeight,
      buttonWidth,
      buttonHeight,
      contentMaxWidth,
    };
  }, [windowWidth, windowHeight]);

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fedef0"
        translucent={false}
      />
      <View style={styles.content} pointerEvents="box-none">
        <Image
          source={patternImg}
          style={[styles.pattern, { height: sizes.patternHeight }]}
          resizeMode="stretch"
        />

        <View
          style={[
            styles.main,
            { paddingTop: Math.max(insets.top, responsiveHeight(16)) },
          ]}
          pointerEvents="box-none"
        >
          <View
            style={[styles.centerArea, { maxWidth: sizes.contentMaxWidth }]}
            pointerEvents="box-none"
          >
            <Image
              source={coupleImg}
              style={{
                width: sizes.coupleWidth,
                height: sizes.coupleHeight,
              }}
              resizeMode="contain"
            />
            <Image
              source={phraseImg}
              style={{
                width: sizes.phraseWidth,
                height: sizes.phraseHeight,
                marginTop: responsiveHeight(20),
              }}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity
            activeOpacity={1}
            onPress={handleStartPress}
            onPressIn={() => setIsPressed(true)}
            onPressOut={() => setIsPressed(false)}
            style={[
              styles.startButtonWrap,
              {
                paddingBottom:
                  Platform.OS === "android"
                    ? Math.max(insets.bottom, responsiveHeight(12))
                    : Math.max(insets.bottom, responsiveHeight(12)),
                marginTop: responsiveHeight(8),
                marginBottom: responsiveHeight(75),
                transform: [{ scale: isPressed ? 0.98 : 1 }],
              },
            ]}
          >
            <Image
              source={startBtnImg}
              style={{
                width: sizes.buttonWidth,
                height: sizes.buttonHeight,
              }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fedef0",
  },
  content: {
    flex: 1,
    backgroundColor: "#fedef0",
  },
  pattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    opacity: 1,
  },
  main: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: responsiveWidth(16),
  },
  centerArea: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonWrap: {
    width: "100%",
    alignItems: "center",
  },
});
