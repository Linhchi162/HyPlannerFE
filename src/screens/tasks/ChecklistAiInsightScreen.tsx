import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import { getPhases } from "../../service/phaseService";
import {
  analyzeChecklistWithAi,
  ChecklistAiKetQua,
  ChecklistAiLuaChon,
} from "../../service/checklistAiService";
import { applyChecklistAiChoice } from "../../service/checklistAiApply";
import { MixpanelService } from "../../service/mixpanelService";
import { getChecklistAiChoiceDisplayLabel } from "../../utils/checklistAiChoiceLabels";
import {
  loadChecklistAiInsightSnapshot,
  saveChecklistAiInsightSnapshot,
} from "../../utils/checklistAiInsightStorage";
const CHECKLIST_INTRO_LINES = [
  "Tập trung vào checklist cưới của bạn: phụ thuộc giữa công việc, rủi ro chậm tiến độ và gợi ý điều chỉnh.",
  "Có thể thêm kịch bản nếu – thì bên dưới.",
];

export default function ChecklistAiInsightScreen() {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  const phases = useSelector(
    (state: RootState) => state.phases.getPhases.phases
  );
  const weddingEvent = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent
  );
  const eventId = weddingEvent?._id;

  const [whatIf, setWhatIf] = useState("");
  const [result, setResult] = useState<ChecklistAiKetQua | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Record<string, boolean>>({});
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setRestored(false);
      setWhatIf("");
      setResult(null);
      setAppliedIds({});
      return;
    }
    let cancelled = false;
    setRestored(false);
    (async () => {
      const snap = await loadChecklistAiInsightSnapshot(eventId);
      if (cancelled) return;
      if (snap) {
        setWhatIf(snap.whatIf);
        setResult(snap.result);
        setAppliedIds(snap.appliedIds || {});
      } else {
        setWhatIf("");
        setResult(null);
        setAppliedIds({});
      }
      setRestored(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId || !restored) return;
    const t = setTimeout(() => {
      void saveChecklistAiInsightSnapshot(eventId, {
        whatIf,
        result,
        appliedIds,
      });
    }, 450);
    return () => clearTimeout(t);
  }, [eventId, restored, whatIf, result, appliedIds]);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle("light-content");
      StatusBar.setBackgroundColor("#f7577c");
      if (Platform.OS === "android") StatusBar.setTranslucent(false);
      return () => {};
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      if (!eventId) return;
      let active = true;
      (async () => {
        try {
          setRefreshing(true);
          await getPhases(eventId, dispatch);
        } catch {
          /* ignore */
        } finally {
          if (active) setRefreshing(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [eventId, dispatch])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (eventId && restored) {
          void saveChecklistAiInsightSnapshot(eventId, {
            whatIf,
            result,
            appliedIds,
          });
        }
      };
    }, [eventId, restored, whatIf, result, appliedIds])
  );

  const runAnalysis = async () => {
    if (!eventId) {
      Alert.alert("Lỗi", "Chưa có sự kiện cưới.");
      return;
    }
    if (!phases.length) {
      Alert.alert(
        "Chưa có dữ liệu",
        "Hãy thêm giai đoạn và công việc trong checklist trước."
      );
      return;
    }
    try {
      setLoading(true);
      setAppliedIds({});
      MixpanelService.track("Checklist AI Analysis Started", {
        phaseCount: phases.length,
        hasWhatIf: !!whatIf.trim(),
      });
      const data = await analyzeChecklistWithAi({
        phases,
        weddingDateIso: weddingEvent?.timeToMarried,
        brideName: weddingEvent?.brideName,
        groomName: weddingEvent?.groomName,
        whatIfScenario: whatIf.trim() || undefined,
      });
      setResult(data);
      void saveChecklistAiInsightSnapshot(eventId, {
        whatIf,
        result: data,
        appliedIds: {},
      });
      MixpanelService.track("Checklist AI Analysis Completed", {
        choiceCount: data.luaChon.length,
      });
    } catch (e: any) {
      const msg = e?.message || "Không thể phân tích. Vui lòng thử lại.";
      Alert.alert("Lỗi", msg);
      MixpanelService.track("Checklist AI Analysis Failed", {
        message: String(msg).slice(0, 120),
      });
    } finally {
      setLoading(false);
    }
  };

  const onApplyChoice = async (choice: ChecklistAiLuaChon) => {
    if (!eventId) return;
    if (appliedIds[choice.id]) return;
    try {
      setApplyingId(choice.id);
      await applyChecklistAiChoice(choice, phases, eventId, dispatch);
      setAppliedIds((prev) => ({ ...prev, [choice.id]: true }));
      MixpanelService.track("Checklist AI Choice Applied", {
        loai: choice.loai,
      });
    } catch (e: any) {
      Alert.alert("Không áp dụng được", e?.message || "Đã có lỗi xảy ra.");
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ChevronLeft size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Trợ lý checklist
          </Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <LinearGradient
        colors={["#fff0f3", "#f8f9fa", "#f3f4f6"]}
        locations={[0, 0.35, 1]}
        style={styles.gradientFill}
      >
        <KeyboardAvoidingView
          style={styles.flex1}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconPill}>
                  <Sparkles size={16} color="#f7577c" />
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardEyebrow}>Phân tích checklist</Text>
                  <Text style={styles.cardTitle}>Gợi ý thông minh</Text>
                </View>
              </View>
              {CHECKLIST_INTRO_LINES.map((line) => (
                <Text key={line} style={styles.intro}>
                  {line}
                </Text>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.inputLabel}>Kịch bản &quot;nếu – thì&quot;</Text>
              <Text style={styles.inputHint}>Tuỳ chọn — mô tả thay đổi để AI điều chỉnh gợi ý</Text>
              <TextInput
                style={styles.whatIfInput}
                placeholder="Ví dụ: Nếu dời ngày cưới lùi 3 tuần thì nên ưu tiên gì?"
                placeholderTextColor="#9ca3af"
                value={whatIf}
                onChangeText={setWhatIf}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={runAnalysis}
              disabled={loading}
              style={styles.ctaWrap}
            >
              <LinearGradient
                colors={loading ? ["#e8a0b3", "#d4899f"] : ["#ff6b90", "#f7577c"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.ctaGradient, loading && styles.ctaDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Sparkles size={20} color="#ffffff" />
                    <Text style={styles.ctaText}>Phân tích checklist</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {refreshing && !loading ? (
              <Text style={styles.hint}>Đang đồng bộ dữ liệu checklist…</Text>
            ) : null}

            {result ? (
              <View style={styles.resultCard}>
                <Text style={styles.resultSectionLabel}>Kết quả</Text>
                <View style={styles.analysisBubble}>
                  <Text style={styles.analysisText}>{result.tomTat}</Text>
                </View>

                {result.luaChon.length > 0 ? (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.actionsHeader}>
                      <Text style={styles.actionsTitle}>Áp dụng nhanh</Text>
                      <Text style={styles.actionsSubtitle}>
                        Chạm một dòng để cập nhật lên server
                      </Text>
                    </View>
                    {result.luaChon.map((c, idx) => {
                      const done = appliedIds[c.id];
                      const busy = applyingId === c.id;
                      const label = getChecklistAiChoiceDisplayLabel(c, phases);
                      return (
                        <TouchableOpacity
                          key={`${c.loai}-${c.taskId || ""}-${c.phaseId || ""}-${c.id}-${idx}`}
                          activeOpacity={0.75}
                          style={[
                            styles.choiceRow,
                            done && styles.choiceRowDone,
                            busy && styles.choiceRowBusy,
                          ]}
                          disabled={busy || done}
                          onPress={() => onApplyChoice(c)}
                        >
                          <View
                            style={[
                              styles.choiceAccent,
                              done && styles.choiceAccentDone,
                            ]}
                          />
                          <View style={styles.choiceBody}>
                            {busy ? (
                              <ActivityIndicator size="small" color="#f7577c" />
                            ) : (
                              <Text
                                style={[
                                  styles.choiceLabel,
                                  done && styles.choiceLabelDone,
                                ]}
                                numberOfLines={4}
                              >
                                {done ? "Đã áp dụng" : label}
                              </Text>
                            )}
                          </View>
                          {!busy && !done ? (
                            <ChevronRight size={20} color="#d1d5db" />
                          ) : done ? (
                            <Text style={styles.checkMark}>✓</Text>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </>
                ) : (
                  <Text style={styles.noChoices}>
                    Không có thao tác tự động gợi ý — bạn vẫn có thể chỉnh checklist
                    thủ công.
                  </Text>
                )}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f7577c",
  },
  flex1: { flex: 1 },
  gradientFill: {
    flex: 1,
  },
  header: {
    backgroundColor: "#f7577c",
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: responsiveWidth(4),
  },
  headerTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(18),
    fontWeight: "700",
    color: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(18),
    paddingBottom: responsiveHeight(48),
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(16),
    padding: responsiveWidth(16),
    marginBottom: responsiveHeight(14),
    borderWidth: 1,
    borderColor: "rgba(247, 87, 124, 0.08)",
    shadowColor: "#f7577c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(12),
  },
  iconPill: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#fff0f3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: responsiveWidth(12),
  },
  cardHeaderText: {
    flex: 1,
  },
  cardEyebrow: {
    fontSize: responsiveFont(11),
    fontWeight: "600",
    color: "#f7577c",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: responsiveHeight(2),
  },
  cardTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(17),
    fontWeight: "700",
    color: "#111827",
  },
  intro: {
    fontSize: responsiveFont(13),
    color: "#4b5563",
    lineHeight: responsiveFont(20),
    marginBottom: responsiveHeight(8),
  },
  inputLabel: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(15),
    fontWeight: "700",
    color: "#111827",
    marginBottom: responsiveHeight(4),
  },
  inputHint: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginBottom: responsiveHeight(10),
    lineHeight: responsiveFont(17),
  },
  whatIfInput: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: responsiveWidth(14),
    paddingHorizontal: responsiveWidth(14),
    paddingVertical: responsiveHeight(12),
    minHeight: responsiveHeight(100),
    fontSize: responsiveFont(14),
    color: "#1f2937",
    backgroundColor: "#fafafa",
  },
  ctaWrap: {
    marginBottom: responsiveHeight(18),
    borderRadius: responsiveWidth(16),
    overflow: "hidden",
    shadowColor: "#f7577c",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: responsiveWidth(10),
    paddingVertical: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(20),
  },
  ctaDisabled: {
    opacity: 0.92,
  },
  ctaText: {
    color: "#ffffff",
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(16),
    fontWeight: "700",
  },
  hint: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    textAlign: "center",
    marginBottom: responsiveHeight(10),
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(16),
    padding: responsiveWidth(16),
    borderWidth: 1,
    borderColor: "rgba(247, 87, 124, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  resultSectionLabel: {
    fontSize: responsiveFont(11),
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: responsiveHeight(10),
  },
  analysisBubble: {
    backgroundColor: "#fff5f8",
    borderRadius: responsiveWidth(14),
    padding: responsiveWidth(14),
    borderLeftWidth: 4,
    borderLeftColor: "#f7577c",
  },
  analysisText: {
    fontSize: responsiveFont(14),
    color: "#374151",
    lineHeight: responsiveFont(22),
  },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: responsiveHeight(18),
  },
  actionsHeader: {
    marginBottom: responsiveHeight(12),
  },
  actionsTitle: {
    fontFamily: "Roboto",
    fontWeight: "400",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    color: "#111827",
    marginBottom: responsiveHeight(4),
  },
  actionsSubtitle: {
    fontSize: responsiveFont(12),
    color: "#6b7280",
    lineHeight: responsiveFont(17),
  },
  choiceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(14),
    marginBottom: responsiveHeight(10),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    overflow: "hidden",
    minHeight: responsiveHeight(52),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  choiceRowDone: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  choiceRowBusy: {
    opacity: 0.88,
  },
  choiceAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: "#f7577c",
  },
  choiceAccentDone: {
    backgroundColor: "#10b981",
  },
  choiceBody: {
    flex: 1,
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(12),
    justifyContent: "center",
  },
  choiceLabel: {
    fontSize: responsiveFont(13),
    color: "#1f2937",
    fontWeight: "600",
    lineHeight: responsiveFont(19),
  },
  choiceLabelDone: {
    color: "#047857",
  },
  checkMark: {
    fontSize: responsiveFont(16),
    color: "#059669",
    fontWeight: "700",
    paddingRight: responsiveWidth(12),
  },
  noChoices: {
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveFont(20),
    marginTop: responsiveHeight(4),
    fontStyle: "italic",
  },
});
