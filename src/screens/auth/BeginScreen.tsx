
import React, { useEffect } from "react";
import { Image, StyleSheet, View, StatusBar } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";

// ...existing code...

export default function BeginScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }, 1500); // 1.5 seconds
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.fullscreen}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" hidden />
      <Image
        source={require("../../../assets/images/ảnh chờ lúc ấn vô app.png")}
        style={styles.fullscreen}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
