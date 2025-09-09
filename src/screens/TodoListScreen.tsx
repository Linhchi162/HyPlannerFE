import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowLeft } from "lucide-react-native";

const TodoListScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={todoStyles.safeArea}>
      <StatusBar barStyle="dark-content" />
      {/* Header tùy chỉnh */}
      <View style={todoStyles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={todoStyles.backButton}
        >
          <ArrowLeft color="#d35a68" size={24} />
        </TouchableOpacity>
        <Text style={todoStyles.headerTitle}>Danh sách công việc</Text>
        {/* Placeholder để căn giữa title */}
        <View style={{ width: 40 }} />
      </View>

      <View style={todoStyles.content}>
        <Text>Nội dung của Todo List sẽ ở đây.</Text>
      </View>
    </SafeAreaView>
  );
};

const todoStyles = StyleSheet.create({
  safeArea: {
    paddingTop: 20,
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  // Style cho header tùy chỉnh
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60, // Chiều cao giống header mặc định
    backgroundColor: "#fff",
    elevation: 1,
    shadowOpacity: 0.1,
    shadowOffset: {
      width: 0,
      height: 1,
    },
  },
  backButton: {
    padding: 5,
    width: 40, // Đảm bảo vùng bấm đủ lớn
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d35a68",
    fontFamily: "serif",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TodoListScreen;
