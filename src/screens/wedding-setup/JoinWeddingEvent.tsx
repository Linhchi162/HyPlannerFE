import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Button, Dialog, Portal } from "react-native-paper";
import { Entypo } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { useEffect, useRef, useState } from "react";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch } from "../../store";
import type { RootStackParamList } from "../../navigation/types";
import { selectCurrentUser } from "../../store/authSlice";
import { getWeddingEvent } from "../../service/weddingEventService";
import { auth, db } from "../../service/firebase";
import {
  decodeEventIdFromInviteCode,
  getJoinRequestNotifierUserIds,
  submitWeddingJoinRequest,
  subscribeMyJoinRequest,
} from "../../service/weddingJoinRequestFirestore";
import { sendExpoPushToUsers } from "../../service/joinRequestExpoPush";

interface JoinWeddingAppBarProps {
  onBack: () => void;
}
const JoinWeddingAppBar = ({ onBack }: JoinWeddingAppBarProps) => {
  return (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Entypo name="chevron-left" size={24} color="#FFF" />
      </TouchableOpacity>
    </Appbar.Header>
  );
};

export default function JoinWeddingEvent() {
  const [code, setCode] = useState<string>("");
  const isFormValid = code.trim().length > 0;
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string>("");
  const [showError, setShowError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<"form" | "waiting">("form");
  const waitingEventIdRef = useRef<string | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  const user = useSelector(selectCurrentUser);
  const userId = user?.id || user?._id;

  useEffect(() => {
    return () => {
      unsubRef.current?.();
    };
  }, []);

  const handleJoinEvent = async () => {
    setShowConfirm(false);

    if (!userId || !user) {
      setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
      setShowError(true);
      return;
    }

    const eventId = decodeEventIdFromInviteCode(code);
    if (!eventId) {
      setError(
        "Mã mời không đúng hoặc không khớp cấu hình backend hiện tại. Hãy xin mã mới và gửi lại yêu cầu."
      );
      setShowError(true);
      return;
    }

    setSubmitting(true);
    try {
      await submitWeddingJoinRequest({
        eventId,
        inviteCode: code.trim(),
        applicantUserId: String(userId),
        fullName: user.fullName || "",
        email: user.email || "",
        picture: user.picture,
      });

      const notifiers = await getJoinRequestNotifierUserIds(eventId);
      await sendExpoPushToUsers(
        notifiers,
        "HyPlanner",
        `${user.fullName || "Có người"} đang xin tham gia kế hoạch cưới.`,
        { type: "join_request", eventId }
      );

      waitingEventIdRef.current = eventId;
      setPhase("waiting");
      unsubRef.current?.();
      unsubRef.current = subscribeMyJoinRequest(eventId, String(userId), (req) => {
        if (!req) return;
        if (req.status === "approved") {
          void getWeddingEvent(String(userId), dispatch).then(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "Main" }],
            });
          });
        }
        if (req.status === "rejected") {
          setPhase("form");
          setError("Yêu cầu tham gia của bạn chưa được chấp nhận.");
          setShowError(true);
          waitingEventIdRef.current = null;
        }
      });
    } catch (e: unknown) {
      console.error("[JoinWeddingEvent] submit request failed", e);
      const code =
        e && typeof e === "object" && "code" in e
          ? String((e as { code: string }).code)
          : "";
      const apiMessage =
        e &&
        typeof e === "object" &&
        "response" in e &&
        (e as { response?: { data?: { message?: string } } }).response?.data
          ?.message
          ? String(
              (e as { response?: { data?: { message?: string } } }).response?.data
                ?.message
            )
          : "";
      const raw =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : "";
      const rawLower = raw.toLowerCase();
      const projectId = db.app.options.projectId || "unknown_project";
      const firebaseUid = auth.currentUser?.uid || "null";
      const msg =
        code.includes("permission-denied") ||
        rawLower.includes("permission-denied") ||
        rawLower.includes("missing or insufficient permissions")
          ? `Không có quyền ghi Firestore cho luồng duyệt tham gia.\n\nKiểm tra nhanh:\n1) Rules đã publish trên đúng project ${projectId}\n2) Firebase Auth Anonymous đã bật\n3) firebaseUid hiện tại không được null (hiện: ${firebaseUid})\n\nCollection cần quyền: weddingJoinRequests / weddingPublicMeta / weddingRoleAssignments.`
          : apiMessage || raw || "Không gửi được yêu cầu. Kiểm tra mạng và quyền Firestore.";
      setError(msg);
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <JoinWeddingAppBar onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {phase === "waiting" ? "Đang chờ duyệt" : "Tham Gia Vào Kế Hoạch Cưới"}
          </Text>
          {phase === "waiting" ? (
            <>
              <Text style={styles.description}>
                Bạn đã gửi yêu cầu tham gia. Chủ kế hoạch hoặc Hỷ Partner sẽ duyệt.
                Khi được chấp nhận, app sẽ tự chuyển vào trang chính.{"\n\n"}
                Bạn vẫn có thể nhận thông báo (push) khi có quyết định — giữ cho phép
                thông báo bật.
              </Text>
              <ActivityIndicator size="large" color="#831843" style={{ marginTop: 24 }} />
            </>
          ) : (
            <>
              <Text style={styles.description}>
                Nhập mã mời — yêu cầu của bạn sẽ được gửi để chủ kế hoạch / Hỷ Partner
                duyệt trước khi bạn vào được kế hoạch.
              </Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Hãy nhập mã mời của bạn*</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mã mời"
                  value={code}
                  onChangeText={setCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="default"
                  returnKeyType="done"
                  placeholderTextColor="#B0B0B0"
                />
              </View>
              <TouchableOpacity
                style={styles.submitButton}
                disabled={!isFormValid || submitting}
                onPress={() => setShowConfirm(true)}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text
                    style={[
                      styles.submitButtonText,
                      { opacity: isFormValid ? 1 : 0.7 },
                    ]}
                  >
                    Gửi yêu cầu tham gia
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
        <Portal>
          <Dialog
            visible={showConfirm}
            onDismiss={() => setShowConfirm(false)}
            style={styles.dialogSurface}
          >
            <Dialog.Title style={styles.dialogTitle}>Xác nhận</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>
                Gửi yêu cầu tham gia? Bạn sẽ vào kế hoạch sau khi được duyệt.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button textColor="#6b7280" onPress={() => setShowConfirm(false)}>
                Hủy
              </Button>
              <Button textColor="#f7577c" onPress={handleJoinEvent}>
                Gửi
              </Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog
            visible={showError}
            onDismiss={() => setShowError(false)}
            style={styles.dialogSurface}
          >
            <Dialog.Title style={styles.dialogTitle}>Thông báo</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.dialogText}>{error}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button textColor="#f7577c" onPress={() => setShowError(false)}>
                Đóng
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </View>
  );
}
const styles = StyleSheet.create({
  backButton: {
    padding: 8,
    marginLeft: responsiveWidth(10),
    backgroundColor: "#ceb6b6ff",
    borderRadius: 20,
    elevation: 0,
  },
  appbarHeader: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#ECD9D9",
  },
  contentContainer: {
    paddingHorizontal: responsiveWidth(15),
    alignItems: "center",
    justifyContent: "center",
    marginTop: responsiveHeight(100),
  },
  title: {
    fontSize: responsiveFont(30),
    color: "#333",
    fontFamily: "Roboto",
    marginTop: responsiveHeight(10),
    textAlign: "center",
  },
  description: {
    fontSize: responsiveFont(12),
    color: "#555",
    textAlign: "center",
    marginVertical: responsiveHeight(10),
    marginBottom: responsiveHeight(20),
  },
  inputWrapper: {
    flex: 1,
    width: "100%",
  },
  label: {
    fontSize: responsiveFont(12),
    color: "#831843",
    fontFamily: "Roboto",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: responsiveFont(13),
    fontFamily: "Roboto",
    borderWidth: 1,
    borderColor: "#F9E2E7",
    marginBottom: 0,
  },
  submitButton: {
    backgroundColor: "#f19aaeff",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    opacity: 0.9,
    marginTop: responsiveHeight(22),
    width: "100%",
  },
  submitButtonText: {
    fontSize: responsiveFont(14),
    fontWeight: "700",
    color: "#fff",
  },
  dialogSurface: {
    backgroundColor: "#fff",
    borderRadius: 16,
  },
  dialogTitle: {
    color: "#111827",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  dialogText: {
    color: "#374151",
  },
});
