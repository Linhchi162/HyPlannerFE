import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ChevronLeft, Phone } from "lucide-react-native";
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
  subscribeVendorRequests,
  VendorRequest,
} from "../../service/vendorService";
import { auth } from "../../service/firebase";

export default function VendorRequestsScreen() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList>>();
  const [requests, setRequests] = useState<VendorRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeVendorRequests(uid, (data) => {
      setRequests(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const formatDate = (value?: any) => {
    if (!value) return "";
    const date = typeof value?.toDate === "function" ? value.toDate() : value;
    if (!(date instanceof Date)) return "";
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={pinkHeaderStyles.titleContainer}>
          <Text style={[styles.headerTitle, pinkHeaderStyles.title]}>
            Yêu cầu liên hệ
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color="#ff5a7a" />
            <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
          </View>
        ) : requests.length === 0 ? (
          <Text style={styles.emptyText}>Chưa có yêu cầu.</Text>
        ) : (
          requests.map((r) => {
            const legacyService = (r as any).serviceName as
              | string
              | undefined;
            return (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{r.userName}</Text>
                  {Array.isArray(r.services) && r.services.length > 0 ? (
                    <Text style={styles.cardSub}>
                      {r.services.map((s) => s.name).join(", ")}
                    </Text>
                  ) : legacyService ? (
                    <Text style={styles.cardSub}>{legacyService}</Text>
                  ) : null}
                  {r.note ? (
                    <Text style={styles.cardSub}>Ghi chú: {r.note}</Text>
                  ) : null}
                  {r.createdAt ? (
                    <Text style={styles.cardSub}>
                      Ngày: {formatDate(r.createdAt)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.callBtn}>
                  <Phone size={16} color="#ff5a7a" />
                  <Text style={styles.callBtnText}>Liên hệ</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
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
    gap: responsiveHeight(10),
  },
  loadingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(24),
  },
  loadingText: {
    marginTop: responsiveHeight(8),
    fontSize: responsiveFont(12),
    color: "#6b7280",
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
  cardInfo: {
    flex: 1,
    paddingRight: responsiveWidth(12),
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
  callBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
    borderWidth: 1,
    borderColor: "#ff5a7a",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(6),
  },
  callBtnText: {
    color: "#ff5a7a",
    fontSize: responsiveFont(12),
    fontFamily: "Montserrat-SemiBold",
  },
  emptyText: {
    textAlign: "center",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
});
