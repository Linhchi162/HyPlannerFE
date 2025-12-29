// screens/CreateWeddingSiteScreen.js

import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  TextInput,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import {
  useNavigation,
  useRoute,
  RouteProp,
  NavigationProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import slugify from "slugify";
import apiClient from "../../api/client";
import { useAppDispatch } from "../../store/hooks";
import { fetchUserInvitation } from "../../store/invitationSlice";

type CreateWeddingSiteRouteProp = RouteProp<
  RootStackParamList,
  "CreateWeddingSite"
>;

export default function CreateWeddingSiteScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<CreateWeddingSiteRouteProp>();
  const { template } = route.params; // Nhận template từ màn hình trước
  const dispatch = useAppDispatch();

  const [groomName, setGroomName] = useState("");
  const [brideName, setBrideName] = useState("");
  const [weddingDate, setWeddingDate] = useState("31/05/2025");
  const [slug, setSlug] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Tự động tạo slug khi tên cô dâu, chú rể thay đổi
  useEffect(() => {
    if (groomName && brideName) {
      const combinedNames = `${groomName} and ${brideName}`;
      setSlug(slugify(combinedNames, { lower: true, strict: true }));
    } else {
      setSlug("");
    }
  }, [groomName, brideName]);

  const handleCreateWebsite = async () => {
    if (!groomName || !brideName || !slug) {
      Alert.alert("Lỗi", "Vui lòng điền đầy đủ các trường bắt buộc (*)");
      return;
    }
    setIsLoading(true);

    try {
      const response = await apiClient.post("/invitation/invitation-letters", {
        templateId: template.id,
        groomName,
        brideName,
        weddingDate,
        slug,
      });
      const result = response.data;
      dispatch(fetchUserInvitation());

      navigation.navigate("WebsiteManagement", { invitation: result.data });
    } catch (error: any) {
      Alert.alert("Đã có lỗi xảy ra", error.message || "Không thể tạo website");
    } finally {
      setIsLoading(false); // <-- Thêm dòng này để dừng loading sau khi navigate
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate("Main", { screen: "Home" })}
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo Mới Website Đám Cưới</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Preview Template */}
        <View style={styles.previewContainer}>
          <Image source={{ uri: template.image }} style={styles.previewImage} />
        </View>

        {/* Form Inputs */}
        <Text style={styles.label}>Tên chú rể*</Text>
        <TextInput
          style={styles.input}
          value={groomName}
          onChangeText={setGroomName}
          placeholder="Nhập tên chú rể"
        />

        <Text style={styles.label}>Tên cô dâu*</Text>
        <TextInput
          style={styles.input}
          value={brideName}
          onChangeText={setBrideName}
          placeholder="Nhập tên cô dâu"
        />

        <Text style={styles.label}>Ngày tổ chức đám cưới*</Text>
        <TextInput
          style={styles.input}
          value={weddingDate}
          onChangeText={setWeddingDate}
          placeholder="DD/MM/YYYY"
        />

        <Text style={styles.label}>Địa chỉ website*</Text>
        <View style={styles.slugInputContainer}>
          <Text style={styles.slugPrefix}>hy-planner-be.vercel.app/</Text>
          <TextInput
            style={styles.slugInput}
            value={slug}
            onChangeText={setSlug}
            placeholder="ten-chu-re-va-co-dau"
            autoCapitalize="none"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleCreateWebsite}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? "Đang tạo..." : "Tạo Website"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Thêm style cho màn hình mới
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FEF7F8",
  },
  header: {
    backgroundColor: "#f4d7ddff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: 18,
    fontWeight: "600",
    color: "#e07181",
  },
  container: { padding: 20 },
  previewContainer: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    borderColor: "#E07181",
    borderWidth: 2,
  },
  previewImage: { width: "100%", height: 200, resizeMode: "cover" },
  label: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    fontFamily: "Montserrat-Medium",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  slugInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  slugPrefix: {
    fontFamily: "Montserrat-Medium",
    paddingLeft: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  slugInput: {
    fontFamily: "Montserrat-Medium",
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#e07181",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: "#F9A8B4",
  },
  buttonText: {
    fontFamily: "Montserrat-SemiBold",
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
