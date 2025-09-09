import React from "react";
import { View, Text, StyleSheet } from "react-native";

const MoodBoardsScreen = () => {
  return (
    <View style={stylesMoodBoards.container}>
      <Text style={stylesMoodBoards.title}>Bảng tâm trạng</Text>
      <Text>Đây là màn hình bảng tâm trạng.</Text>
    </View>
  );
};

const stylesMoodBoards = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
});

export default MoodBoardsScreen;
