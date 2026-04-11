import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import type { RootStackParamList } from "../../navigation/types";
import type { AppDispatch } from "../../store";
import { selectCurrentUser } from "../../store/authSlice";
import { useWeddingPermissions } from "../../hooks/useWeddingPermissions";
import {
  markJoinRequestApproved,
  markJoinRequestRejected,
  subscribePendingJoinRequests,
  type WeddingJoinRequest,
  encodeEventIdToInviteCode,
  getInviteCodeSalt,
} from "../../service/weddingJoinRequestFirestore";
import { addMemberToWeddingByCode, getWeddingEvent } from "../../service/weddingEventService";
import { saveWeddingRoleAssignments, type WeddingRoleAssignmentsDoc } from "../../service/weddingRoleFirestore";
import { sendExpoPushToUsers } from "../../service/joinRequestExpoPush";
import { doc, getDoc } from "firebase/firestore";
import { db, ensureAnonymousFirebaseAuth } from "../../service/firebase";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";

type ApproveRole = "none" | "partner" | "assistant" | "observer";

function extractErrorMessage(e: unknown): string {
  if (!e || typeof e !== "object") return "";
  const err = e as {
    message?: string;
    response?: { data?: { message?: string } };
    config?: { url?: string };
    status?: number;
    code?: string;
  };
  const apiMessage = err.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.trim().length > 0) {
    const lower = apiMessage.trim().toLowerCase();
    if (lower === "server error" || lower === "internal server error") {
      const endpoint = err.config?.url || "/weddingEvents/addMember";
      const raw = String(err.message || "");
      if (raw.includes("Cast to ObjectId failed")) {
        return `Mã mời không khớp backend (BE decode ra eventId rỗng). Nếu BE không cấu hình SECRET_KEY_SALT thì FE cũng phải dùng salt rỗng và tạo lại request/mã mời mới.`;
      }
      return `Server error từ API ${endpoint}. Khả năng cao backend đang chặn hoặc lỗi khi thêm member bằng mã.`;
    }
    return apiMessage;
  }
  if (err.code === "permission-denied") {
    return "Bạn chưa có quyền Firestore để duyệt/gán vai. Hãy cập nhật Firestore Rules cho weddingJoinRequests và weddingRoleAssignments.";
  }
  if (
    typeof err.message === "string" &&
    (err.message.includes("Missing or insufficient permissions") ||
      err.message.includes("permission-denied"))
  ) {
    return "Bạn chưa có quyền Firestore để duyệt/gán vai. Hãy cập nhật Firestore Rules cho weddingJoinRequests và weddingRoleAssignments.";
  }
  return typeof err.message === "string" ? err.message : "";
}

function isCastObjectIdError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const err = e as {
    message?: string;
    error?: string;
    response?: { data?: { error?: string; message?: string } };
  };
  const texts = [
    err.message,
    err.error,
    err.response?.data?.error,
    err.response?.data?.message,
  ]
    .filter((x): x is string => typeof x === "string")
    .join(" | ")
    .toLowerCase();
  return texts.includes("cast to objectid failed") || texts.includes('value ""');
}

function emptyAssignments(): WeddingRoleAssignmentsDoc {
  return { partnerUserId: null, assistantUserId: null, observerUserId: null };
}

async function loadAssignments(eventId: string): Promise<WeddingRoleAssignmentsDoc> {
  await ensureAnonymousFirebaseAuth();
  const snap = await getDoc(doc(db, "weddingRoleAssignments", eventId));
  if (!snap.exists()) return emptyAssignments();
  const d = snap.data() as Record<string, unknown>;
  return {
    partnerUserId:
      typeof d.partnerUserId === "string" ? d.partnerUserId : null,
    assistantUserId:
      typeof d.assistantUserId === "string" ? d.assistantUserId : null,
    observerUserId:
      typeof d.observerUserId === "string" ? d.observerUserId : null,
  };
}

export default function WeddingJoinRequestsScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector(selectCurrentUser);
  const approverId = (user?.id || user?._id || "") as string;
  const { canAssignRoles, eventId } = useWeddingPermissions();
  const [list, setList] = useState<WeddingJoinRequest[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pick, setPick] = useState<WeddingJoinRequest | null>(null);
  const [role, setRole] = useState<ApproveRole>("none");

  useEffect(() => {
    if (!eventId || !canAssignRoles) return;
    return subscribePendingJoinRequests(eventId, setList);
  }, [eventId, canAssignRoles]);

  const approve = useCallback(async () => {
    if (!pick || !eventId || !approverId) return;
    setBusyId(pick.applicantUserId);
    try {
      const codeFromRequest = (pick.inviteCode || "").trim();
      const generatedWithCurrent = encodeEventIdToInviteCode(String(eventId));
      const generatedWithEmptySalt = encodeEventIdToInviteCode(String(eventId), "");
      const generatedWithEnvSalt = encodeEventIdToInviteCode(
        String(eventId),
        getInviteCodeSalt()
      );
      const codeCandidates = Array.from(
        new Set(
          [codeFromRequest, generatedWithCurrent, generatedWithEnvSalt, generatedWithEmptySalt]
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.trim())
            .filter((x) => x.length > 0)
        )
      );

      if (codeCandidates.length === 0) {
        Alert.alert(
          "Thiếu mã mời trong yêu cầu",
          "Không có mã hợp lệ để duyệt. Hãy yêu cầu thành viên gửi lại yêu cầu tham gia bằng mã mới."
        );
        return;
      }

      let joined = false;
      let lastError: unknown = null;
      for (const c of codeCandidates) {
        try {
          await addMemberToWeddingByCode(c, pick.applicantUserId);
          joined = true;
          break;
        } catch (err) {
          lastError = err;
          if (!isCastObjectIdError(err)) {
            throw err;
          }
        }
      }
      if (!joined) {
        throw lastError ?? new Error("Không thêm được thành viên bằng các mã dự phòng.");
      }

      if (role !== "none") {
        const base = await loadAssignments(eventId);
        const uid = pick.applicantUserId;
        if (base.partnerUserId === uid) base.partnerUserId = null;
        if (base.assistantUserId === uid) base.assistantUserId = null;
        if (base.observerUserId === uid) base.observerUserId = null;
        if (role === "partner") base.partnerUserId = uid;
        if (role === "assistant") base.assistantUserId = uid;
        if (role === "observer") base.observerUserId = uid;
        await saveWeddingRoleAssignments(eventId, base);
      }
      await markJoinRequestApproved({
        eventId,
        applicantUserId: pick.applicantUserId,
        decidedByUserId: approverId,
      });
      await getWeddingEvent(approverId, dispatch);
      await sendExpoPushToUsers(
        [pick.applicantUserId],
        "HyPlanner",
        "Bạn đã được chấp nhận vào kế hoạch cưới. Mở app để tiếp tục.",
        { type: "join_approved", eventId }
      );
      setPick(null);
      setRole("none");
      Alert.alert("Đã duyệt", "Thành viên đã được thêm vào kế hoạch.");
    } catch (e: unknown) {
      console.error("[WeddingJoinRequests] approve failed", e);
      const msg =
        extractErrorMessage(e) ||
        "Không thêm được thành viên. Có thể tài khoản này chưa có quyền thêm member ở backend, hoặc Firestore rules chưa cho phép duyệt/gán vai.";
      Alert.alert("Lỗi", msg);
    } finally {
      setBusyId(null);
    }
  }, [pick, eventId, approverId, role, dispatch]);

  const reject = useCallback(
    async (row: WeddingJoinRequest) => {
      if (!eventId || !approverId) return;
      Alert.alert("Từ chối", `Từ chối yêu cầu của ${row.fullName}?`, [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            setBusyId(row.applicantUserId);
            try {
              await markJoinRequestRejected({
                eventId,
                applicantUserId: row.applicantUserId,
                decidedByUserId: approverId,
              });
              await sendExpoPushToUsers(
                [row.applicantUserId],
                "HyPlanner",
                "Yêu cầu tham gia kế hoạch cưới chưa được chấp nhận.",
                { type: "join_rejected", eventId }
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ]);
    },
    [eventId, approverId]
  );

  if (!canAssignRoles) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Chỉ chủ kế hoạch hoặc Hỷ Partner duyệt được.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.safe}>
      <Appbar.Header style={styles.appbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Entypo name="chevron-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Appbar.Content title="Duyệt tham gia" titleStyle={styles.appbarTitle} />
      </Appbar.Header>
      
      <FlatList
        data={list}
        keyExtractor={(item) => item.applicantUserId}
        ListEmptyComponent={
          <Text style={styles.empty}>Không có yêu cầu đang chờ.</Text>
        }
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.fullName || "Không tên"}</Text>
            <Text style={styles.email}>{item.email || ""}</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                disabled={busyId !== null}
                onPress={() => {
                  setRole("none");
                  setPick(item);
                }}
              >
                <Text style={styles.btnPrimaryText}>Duyệt & gán vai</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnGhost]}
                disabled={busyId !== null}
                onPress={() => reject(item)}
              >
                <Text style={styles.btnGhostText}>Từ chối</Text>
              </TouchableOpacity>
            </View>
            {busyId === item.applicantUserId ? (
              <ActivityIndicator style={{ marginTop: 8 }} color="#D95D74" />
            ) : null}
          </View>
        )}
      />

      <Modal visible={!!pick} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Gán vai trò (tuỳ chọn)</Text>
            <Text style={styles.modalSub}>
              {pick?.fullName} — sau khi duyệt sẽ có trong danh sách thành viên.
            </Text>
            {(
              [
                ["none", "Chỉ thành viên (chưa gán vai đặc biệt)"],
                ["partner", "Hỷ Partner"],
                ["assistant", "Hỷ Assistant"],
                ["observer", "Hỷ Observer"],
              ] as const
            ).map(([k, label]) => (
              <TouchableOpacity
                key={k}
                style={[styles.roleRow, role === k && styles.roleRowOn]}
                onPress={() => setRole(k)}
              >
                <Text style={styles.roleLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActions}>
              <Button
                textColor="#6b7280"
                onPress={() => {
                  setPick(null);
                  setRole("none");
                }}
              >
                Hủy
              </Button>
              <Button
                mode="contained"
                buttonColor="#f7577c"
                textColor="#fff"
                onPress={() => approve()}
                loading={busyId !== null}
              >
                Xác nhận duyệt
              </Button>
            </View>
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
    fontWeight: "700",
    fontSize: responsiveFont(16),
    color: "#fff",
  },
  intro: {
    padding: responsiveWidth(16),
    color: "#4b5563",
    fontSize: responsiveFont(13),
    lineHeight: 20,
  },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  card: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F9E2E7",
    backgroundColor: "#FFFBFC",
  },
  name: { fontSize: responsiveFont(16), fontWeight: "700", color: "#111" },
  email: { fontSize: responsiveFont(12), color: "#6b7280", marginTop: 2 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  btnPrimary: { backgroundColor: "#f7577c" },
  btnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: responsiveFont(13) },
  btnGhost: { borderWidth: 1, borderColor: "#f3cad3", backgroundColor: "#fff" },
  btnGhostText: { color: "#9E182B", fontWeight: "700" },
  muted: { color: "#6b7280", textAlign: "center" },
  link: { color: "#D95D74", marginTop: 12, fontWeight: "600" },
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F9E2E7",
  },
  modalTitle: { fontSize: responsiveFont(17), fontWeight: "700", textAlign: "center" },
  modalSub: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    textAlign: "center",
    marginVertical: 12,
  },
  roleRow: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 8,
  },
  roleRowOn: { borderColor: "#f7577c", backgroundColor: "#FFF5F7" },
  roleLabel: { fontSize: responsiveFont(13) },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
});
