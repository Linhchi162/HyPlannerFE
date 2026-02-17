import React, { useEffect, useRef, useState } from "react";
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
import { ChevronLeft, Plus, Trash2 } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { pinkHeaderStyles } from "../../styles/pinkHeader";
import {
  getVendorProfileByUid,
  updateVendorProfile,
  VendorServiceItem,
} from "../../service/vendorService";
import { auth } from "../../service/firebase";

export default function VendorServicesScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [services, setServices] = useState<VendorServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const uid = auth.currentUser?.uid;
        if (!uid) {
          if (isMounted) setLoading(false);
          return;
        }
        const data = await getVendorProfileByUid(uid);
        if (isMounted && data?.services) {
          setServices(data.services);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = async (
    next: VendorServiceItem[]
  ): Promise<"ok" | "timeout" | "error"> => {
    const uid = auth.currentUser?.uid;
    if (!uid) return "error";
    try {
      setSaving(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        setSaving(false);
      }, 10000);
      const timeoutMs = 12000;
      await Promise.race([
        updateVendorProfile(uid, { services: next }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), timeoutMs)
        ),
      ]);
      return "ok";
    } catch (err: any) {
      return err?.message === "timeout" ? "timeout" : "error";
    } finally {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      setSaving(false);
    }
  };

  const addService = async () => {
    if (saving) return;
    if (!name.trim()) return;
    const next = [
      ...services,
      { id: Date.now().toString(), name: name.trim(), price: price.trim() },
    ];
    setServices(next);
    const result = await persist(next);
    setName("");
    setPrice("");
    if (result === "ok") {
      Alert.alert("Thành công", "Đã thêm gói dịch vụ.");
    } else if (result === "timeout") {
      Alert.alert(
        "Đã gửi",
        "Kết nối chậm. Vui lòng kiểm tra lại danh sách dịch vụ."
      );
    } else {
      Alert.alert("Lỗi", "Không thể lưu dịch vụ. Vui lòng thử lại.");
    }
  };

  const removeService = async (id: string) => {
    if (saving) return;
    const next = services.filter((s) => s.id !== id);
    setServices(next);
    const result = await persist(next);
    if (result === "ok") {
      Alert.alert("Thành công", "Đã xóa gói dịch vụ.");
    } else if (result === "timeout") {
      Alert.alert(
        "Đã gửi",
        "Kết nối chậm. Vui lòng kiểm tra lại danh sách dịch vụ."
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Quản lý dịch vụ
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>Tên dịch vụ</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ví dụ: Gói chụp ảnh ngoại cảnh"
          placeholderTextColor="#9ca3af"
        />

        <Text style={styles.label}>Giá</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          placeholder="VD: 5.000.000"
          placeholderTextColor="#9ca3af"
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.primaryBtnDisabled]}
          onPress={addService}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Plus size={18} color="#ffffff" />
              <Text style={styles.primaryBtnText}>Thêm dịch vụ</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.list}>
          {loading ? (
            <Text style={styles.emptyText}>Đang tải dịch vụ...</Text>
          ) : services.length === 0 ? (
            <Text style={styles.emptyText}>Chưa có dịch vụ.</Text>
          ) : (
            services.map((s) => (
              <View key={s.id} style={styles.card}>
                <View>
                  <Text style={styles.cardTitle}>{s.name}</Text>
                  {s.price ? (
                    <Text style={styles.cardSub}>Giá: {s.price}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => removeService(s.id)}>
                  <Trash2 size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    backgroundColor: "#ff5a7a",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    height: responsiveHeight(56),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  content: {
    padding: responsiveWidth(16),
    paddingBottom: responsiveHeight(120),
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
  primaryBtn: {
    marginTop: responsiveHeight(16),
    backgroundColor: "#ff5a7a",
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(6),
  },
  primaryBtnText: {
    color: "#ffffff",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
  },
  primaryBtnDisabled: {
    opacity: 0.7,
  },
  list: {
    marginTop: responsiveHeight(16),
    gap: responsiveHeight(10),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#111827",
  },
  cardSub: {
    marginTop: responsiveHeight(4),
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
});
