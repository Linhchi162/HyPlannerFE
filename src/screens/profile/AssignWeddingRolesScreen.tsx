import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useSelector } from "react-redux";
import type { RootStackParamList } from "../../navigation/types";
import type { RootState } from "../../store";
import { saveWeddingRoleAssignments } from "../../service/weddingRoleFirestore";
import { useWeddingPermissions } from "../../hooks/useWeddingPermissions";
import type { Member } from "../../store/weddingEventSlice";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";

type Slot = "partner" | "assistant" | "observer";

const SLOT_LABEL: Record<Slot, string> = {
  partner: "Hỷ Partner",
  assistant: "Hỷ Assistant",
  observer: "Hỷ Observer",
};

const SLOT_DESC: Record<Slot, string> = {
  partner:
    "Người còn lại trong cặp đôi — quyền như chủ kế hoạch (tối đa 1 người).",
  assistant:
    "Hỗ trợ: xem & thêm mọi thứ; chỉ sửa/xóa dữ liệu do chính họ tạo (tối đa 1).",
  observer: "Chỉ xem, không chỉnh sửa (tối đa 1).",
};

function memberDisplayName(m?: Partial<Member> | null): string {
  if (!m) return "Thành viên";
  const fullName = typeof m.fullName === "string" ? m.fullName.trim() : "";
  if (fullName) return fullName;
  const email = typeof m.email === "string" ? m.email.trim() : "";
  if (email) return email;
  return "Thành viên";
}

export default function AssignWeddingRolesScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const weddingEvent = useSelector(
    (s: RootState) => s.weddingEvent.getWeddingEvent.weddingEvent
  );
  const {
    assignments,
    canAssignRoles,
    eventId,
    creatorId,
    userId,
  } = useWeddingPermissions();

  const [pickerSlot, setPickerSlot] = useState<Slot | null>(null);
  const [saving, setSaving] = useState(false);

  const members = weddingEvent?.member || [];

  const pickableMembers = useMemo(() => {
    const filtered = members.filter(
      (m) =>
        m._id != null &&
        String(m._id).length > 0 &&
        String(m._id) !== String(creatorId) &&
        String(m._id) !== String(userId)
    );
    const seen = new Set<string>();
    const unique: Member[] = [];
    for (const m of filtered) {
      const id = String(m._id);
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(m);
    }
    return unique;
  }, [members, creatorId, userId]);

  const memberById = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach((m) => {
      if (m._id != null && String(m._id).length > 0)
        map.set(String(m._id), m);
    });
    return map;
  }, [members]);

  const labelForUserId = useCallback(
    (id: string | null) => {
      if (!id) return "Chưa gán";
      const key = String(id);
      return memberDisplayName(memberById.get(key));
    },
    [memberById]
  );

  const persist = useCallback(
    async (next: typeof assignments) => {
      if (!eventId) return;
      setSaving(true);
      try {
        await saveWeddingRoleAssignments(eventId, next);
      } catch {
        Alert.alert(
          "Không lưu được",
          "Kiểm tra kết nối và quyền Firestore cho collection weddingRoleAssignments."
        );
      } finally {
        setSaving(false);
      }
    },
    [eventId]
  );

  const assignUserToSlot = useCallback(
    async (slot: Slot, memberId: string | null) => {
      const next = { ...assignments };
      if (memberId) {
        if (next.partnerUserId === memberId) next.partnerUserId = null;
        if (next.assistantUserId === memberId) next.assistantUserId = null;
        if (next.observerUserId === memberId) next.observerUserId = null;
      }
      if (slot === "partner") next.partnerUserId = memberId;
      if (slot === "assistant") next.assistantUserId = memberId;
      if (slot === "observer") next.observerUserId = memberId;
      await persist(next);
      setPickerSlot(null);
    },
    [assignments, persist]
  );

  const openPicker = (slot: Slot) => {
    if (!canAssignRoles) {
      Alert.alert("Không có quyền", "Chỉ chủ kế hoạch hoặc Hỷ Partner mới giao quyền được.");
      return;
    }
    setPickerSlot(slot);
  };

  if (!canAssignRoles) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Bạn không có quyền truy cập màn hình này.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnLabel}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rows: Slot[] = ["partner", "assistant", "observer"];

  return (
    <View style={styles.safe}>
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Entypo name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Appbar.Content title="Giao quyền trong app" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <Text style={styles.intro}>
        Chọn tối đa một người cho mỗi vai. Thành viên cần đã được mời vào kế hoạch cưới.
      </Text>

      {rows.map((slot) => {
        const id =
          slot === "partner"
            ? assignments.partnerUserId
            : slot === "assistant"
              ? assignments.assistantUserId
              : assignments.observerUserId;
        return (
          <View key={slot} style={styles.card}>
            <Text style={styles.cardTitle}>{SLOT_LABEL[slot]}</Text>
            <Text style={styles.cardDesc}>{SLOT_DESC[slot]}</Text>
            <TouchableOpacity
              style={styles.pickRow}
              onPress={() => openPicker(slot)}
              disabled={saving}
            >
              <Text style={styles.pickValue}>{labelForUserId(id)}</Text>
              <Entypo name="chevron-down" size={20} color="#9E182B" />
            </TouchableOpacity>
            {id ? (
              <TouchableOpacity
                onPress={() => assignUserToSlot(slot, null)}
                disabled={saving}
              >
                <Text style={styles.clear}>Gỡ vai trò</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}

      <Modal visible={!!pickerSlot} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <FlatList
              data={pickableMembers}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item, index) =>
                item._id != null && String(item._id).length > 0
                  ? `member-${String(item._id)}`
                  : `pickable-member-${index}`
              }
              ListHeaderComponent={
                <Text style={styles.modalTitle}>
                  Chọn {pickerSlot ? SLOT_LABEL[pickerSlot] : ""}
                </Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberRow}
                  onPress={() => pickerSlot && assignUserToSlot(pickerSlot, item._id)}
                  accessibilityRole="button"
                >
                  <Text style={styles.memberName}>{memberDisplayName(item)}</Text>
                  <Text style={styles.memberEmail}>{item.email || ""}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPickList}>
                  <Text style={styles.muted}>
                    Chưa có thành viên nào để gán (trừ bạn và chủ sự kiện). Hãy mời
                    thành viên trước.
                  </Text>
                </View>
              }
              ListFooterComponent={
                <TouchableOpacity
                  style={styles.modalClose}
                  onPress={() => setPickerSlot(null)}
                >
                  <Text style={styles.modalCloseLabel}>Đóng</Text>
                </TouchableOpacity>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F9F9F9" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  appbar: { backgroundColor: "#f7577c" },
  appbarTitle: {
    fontFamily: "Roboto",
    fontWeight: "600",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    color: "#fff",
  },
  intro: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    color: "#4b5563",
    fontSize: responsiveFont(13),
    lineHeight: 20,
  },
  card: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    padding: responsiveWidth(14),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F9E2E7",
    backgroundColor: "#FFFBFC",
  },
  cardTitle: {
    fontSize: responsiveFont(15),
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginBottom: 10,
  },
  pickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F9E2E7",
  },
  pickValue: { fontSize: responsiveFont(14), color: "#111827", flex: 1 },
  clear: {
    marginTop: 8,
    color: "#9E182B",
    fontSize: responsiveFont(13),
    fontWeight: "600",
  },
  muted: { color: "#9ca3af", fontSize: responsiveFont(13) },
  backBtn: { marginTop: 16, padding: 12 },
  backBtnLabel: { color: "#D95D74", fontWeight: "600" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "70%",
    paddingBottom: 24,
    borderWidth: 1,
    borderColor: "#F9E2E7",
  },
  modalTitle: {
    fontSize: responsiveFont(16),
    fontWeight: "700",
    padding: 16,
    textAlign: "center",
  },
  memberRow: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  memberName: { fontSize: responsiveFont(14), fontWeight: "600" },
  memberEmail: { fontSize: responsiveFont(12), color: "#6b7280", marginTop: 2 },
  modalClose: {
    marginTop: 8,
    alignSelf: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalCloseLabel: { color: "#D95D74", fontWeight: "700" },
  emptyPickList: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
});
