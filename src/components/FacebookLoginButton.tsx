import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
export default function FacebookLoginButton({
  onLogin,
}: {
  onLogin: () => void;
}) {
  return (
    <View style={styles.buttonContainer}>
      <TouchableOpacity style={styles.touchableArea} onPress={onLogin}>
        <FontAwesome name="facebook-official" size={24} color="#fff" />
        <Text style={styles.touchableText}>Đăng nhập bằng Facebook</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 20,
    width: "80%",
    borderRadius: 8,
    overflow: "hidden",
  },
  touchableArea: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#3b5998",
    paddingVertical: 12,
    borderRadius: 8,
  },
  touchableText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
