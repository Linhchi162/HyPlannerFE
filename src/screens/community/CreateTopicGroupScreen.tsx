import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import { useAppDispatch } from "../../store/hooks";
import { createNewTopicGroup, fetchAllTopicGroups } from "../../store/topicGroupSlice";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";

const CATEGORIES = [
  "Rustic",
  "DIY",
  "Outdoor Photography",
  "Budget Saving",
  "Venue Selection",
  "Dress & Fashion",
  "Decoration",
];

export default function CreateTopicGroupScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập tên nhóm.");
      return;
    }
    try {
      setSaving(true);
      await dispatch(
        createNewTopicGroup({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          isPublic: true,
        })
      ).unwrap();
      await dispatch(fetchAllTopicGroups({ page: 1, limit: 20 })).unwrap();
      Alert.alert("Thành công", "Đã tạo nhóm.");
      navigation.goBack();
    } catch {
      Alert.alert("Lỗi", "Không thể tạo nhóm.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo nhóm</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tên nhóm</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Ý tưởng tiệc cưới ngoài trời"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả ngắn về nhóm..."
          placeholderTextColor="#9ca3af"
          multiline
        />

        <Text style={styles.label}>Danh mục</Text>
        <View style={styles.categoryRow}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.categoryChip,
                category === c && styles.categoryChipActive,
              ]}
              onPress={() => setCategory(c)}
            >
              <Text
                style={[
                  styles.categoryText,
                  category === c && styles.categoryTextActive,
                ]}
              >
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.primaryBtnText}>Tạo nhóm</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    height: responsiveHeight(56),
    paddingHorizontal: responsiveWidth(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(40),
  },
  label: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#111827",
    marginTop: responsiveHeight(12),
    marginBottom: responsiveHeight(6),
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(10),
    paddingHorizontal: responsiveWidth(12),
    height: responsiveHeight(44),
    fontSize: responsiveFont(13),
    color: "#111827",
  },
  textArea: {
    height: responsiveHeight(90),
    textAlignVertical: "top",
    paddingVertical: responsiveHeight(10),
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
  },
  categoryChip: {
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(6),
    borderRadius: responsiveWidth(14),
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  categoryChipActive: {
    backgroundColor: "#ff5a7a",
    borderColor: "#ff5a7a",
  },
  categoryText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#374151",
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  primaryBtn: {
    marginTop: responsiveHeight(16),
    backgroundColor: "#ff5a7a",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
});
