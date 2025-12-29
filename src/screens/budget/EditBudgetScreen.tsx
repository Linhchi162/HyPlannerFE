import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Avatar,
  Icon,
  IconButton,
  List,
  RadioButton,
  TextInput,
} from "react-native-paper";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { editTask, getTasks } from "../../service/taskService";
import { getPhases } from "../../service/phaseService";
import { Member } from "../../store/weddingEventSlice";
import { RootStackParamList } from "../../navigation/types";
import { editActivity, getActivity } from "../../service/activityService";
import { getGroupActivities } from "../../service/groupActivityService";
import { MixpanelService } from "../../service/mixpanelService";

type EditBudgetAppbarProps = {
  onBack: () => void;
  onCheck: () => void;
  loading?: boolean;
};

const EditBudgetAppbar = React.memo(
  ({ onBack, onCheck, loading }: EditBudgetAppbarProps) => (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
        <Entypo name="chevron-left" size={24} color="#000000" />
      </TouchableOpacity>
      <Appbar.Content
        title="Chỉnh sửa ngân sách"
        titleStyle={styles.appbarTitle}
      />
      <TouchableOpacity
        onPress={onCheck}
        style={{ padding: 8, marginRight: 8 }}
      >
        {loading ? (
          <ActivityIndicator color="#000000" />
        ) : (
          <Entypo name="check" size={24} color="#000000" />
        )}
      </TouchableOpacity>
    </Appbar.Header>
  )
);

export const EmptyMemberComponent = () => (
  <View style={styles.emptyMemberContainer}>
    <FontAwesome5
      name="user-friends"
      size={36}
      color="#F9CBD6"
      style={{ marginBottom: 8 }}
    />
    <Text style={styles.emptyMemberText}>Không có thành viên nào.</Text>
  </View>
);

export default function EditBudgetScreen() {
  const [activityName, setActivityName] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [activityNameError, setActivityNameError] = useState("");
  const [payerError, setPayerError] = useState("");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "EditBudget">>();
  const { activityId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const activity = useSelector(
    (state: RootState) => state.activities.getActivityInfo.activity
  );
  const [payer, setPayer] = useState<string>("");
  //   const task = useSelector((state: RootState) => state.tasks.getTaskInfo.task);
  //   const memberInTask = useSelector((state: RootState) => state.tasks.getTaskInfo.task?.member) || [];
  const [expectedBudget, setExpectedBudget] = useState<number | null>(null); // Giá trị ban đầu là null
  const [actualBudget, setActualBudget] = useState<number | null>(null);
  // const [budgetError, setBudgetError] = useState<string>("");
  //   const [members, setMembers] = useState<Member[]>(memberInTask);
  // const eventId = "68c29283931d7e65bd3ad689"; // Fix cứng tạm thời
  const { eventId } = route.params;
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => {
    const fetchBudget = async () => {
      setLoadingBudget(true);
      try {
        await getActivity(activityId, dispatch);
        MixpanelService.track("Viewed Edit Budget Screen", {
          "Budget ID": activityId,
        });
      } catch (error) {
        console.error("Error fetching budget:", error);
      } finally {
        setLoadingBudget(false);
      }
    };
    fetchBudget();
  }, [activityId, dispatch]);

  useEffect(() => {
    if (activity) {
      setActivityName(activity.activityName || "");
      setActivityNote(activity.activityNote || "");
      setExpectedBudget(activity.expectedBudget || null);
      setActualBudget(activity.actualBudget || null);
      setPayer(activity.payer || "");
    }
  }, [activity]);

  const handleSave = async () => {
    try {
      if (activityName.trim() === "") {
        setActivityNameError("Tên ngân sách không được để trống");
        return;
      }
      if (!payer || payer.trim() === "") {
        setPayerError("Vui lòng chọn người chi trả");
        return;
      }
      setActivityNameError("");
      setPayerError("");
      setActionLoading(true);

      const budgetData = {
        activityName: activityName,
        activityNote: activityNote,
        expectedBudget: expectedBudget === null ? 0 : expectedBudget,
        actualBudget: actualBudget === null ? 0 : actualBudget,
        payer: payer,
      };

      await editActivity(activityId, budgetData, dispatch);

      MixpanelService.track("Edited Budget Item", {
        "Budget ID": activityId,
        "Budget Name": budgetData.activityName,
        "Expected Amount": budgetData.expectedBudget,
        "Actual Amount": budgetData.actualBudget,
        Payer: budgetData.payer,
      });
      await getGroupActivities(eventId, dispatch);
      setActionLoading(false);
      navigation.goBack();
    } catch (error: any) {
      console.error("Error saving budget:", error);
      setActionLoading(false);
      const errorMessage =
        error.response?.data?.message || "Có lỗi xảy ra khi lưu ngân sách";
      alert(errorMessage);
    }
  };
  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  return (
    <View style={styles.safeArea}>
      <EditBudgetAppbar
        onBack={navigation.goBack}
        onCheck={handleSave}
        loading={actionLoading}
      />
      {loadingBudget ? (
        <ActivityIndicator size="large" color="#D95D74" />
      ) : (
        <FlatList
          data={[]} // Không có dữ liệu, chỉ dùng để hiển thị nội dung
          keyExtractor={(_, index) => index.toString()}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={[styles.scrollView, styles.contentContainer]}>
              {/* Tên ngân sách */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon source="heart" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Tên ngân sách</Text>
                </View>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập tên ngân sách"
                  value={activityName}
                  onChangeText={setActivityName}
                  style={styles.textInput}
                  outlineStyle={styles.textInputOutline}
                  theme={{
                    colors: {
                      primary: "#D95D74",
                      onSurfaceVariant: "#AAAAAA",
                    },
                  }}
                />
                {activityNameError && (
                  <Text style={{ color: "red", marginTop: 4, marginLeft: 4 }}>
                    {activityNameError}
                  </Text>
                )}
              </View>

              {/* Ghi chú */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon source="message-text" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Ghi chú</Text>
                </View>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập ghi chú"
                  value={activityNote}
                  onChangeText={setActivityNote}
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.textArea]}
                  outlineStyle={styles.textInputOutline}
                  theme={{
                    colors: {
                      primary: "#D95D74",
                      onSurfaceVariant: "#AAAAAA",
                    },
                  }}
                />
              </View>

              {/* Tiền */}

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="coins" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Ngân sách dự kiến</Text>
                </View>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập ngân sách dự kiến"
                  value={
                    expectedBudget !== null ? formatNumber(expectedBudget) : ""
                  }
                  onChangeText={(value) => {
                    if (value === "") {
                      setExpectedBudget(null);
                    } else {
                      const numericValue = parseInt(
                        value.replace(/\./g, ""),
                        10
                      );
                      if (!isNaN(numericValue)) {
                        setExpectedBudget(numericValue);
                      }
                    }
                  }}
                  style={[styles.textInput]}
                  outlineStyle={styles.textInputOutline}
                  keyboardType="numeric"
                  theme={{
                    colors: {
                      primary: "#D95D74",
                      onSurfaceVariant: "#AAAAAA",
                    },
                  }}
                />
              </View>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="coins" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Ngân sách thực tế</Text>
                </View>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập ngân sách thực tế"
                  value={
                    actualBudget !== null ? formatNumber(actualBudget) : ""
                  }
                  onChangeText={(value) => {
                    if (value === "") {
                      setActualBudget(null);
                    } else {
                      const numericValue = parseInt(
                        value.replace(/\./g, ""),
                        10
                      );
                      if (!isNaN(numericValue)) {
                        setActualBudget(numericValue);
                      }
                    }
                  }}
                  style={[styles.textInput]}
                  outlineStyle={styles.textInputOutline}
                  theme={{
                    colors: {
                      primary: "#D95D74",
                      onSurfaceVariant: "#AAAAAA",
                    },
                  }}
                />
              </View>

              {/* Người trả */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="user" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Người chi trả</Text>
                </View>
                {payerError ? (
                  <Text style={{ color: "red", fontSize: 12, marginBottom: 8 }}>
                    {payerError}
                  </Text>
                ) : null}
                <RadioButton.Group
                  onValueChange={(value) => {
                    setPayer(value);
                    setPayerError("");
                  }}
                  value={payer}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 16,
                      }}
                    >
                      <RadioButton.Android
                        value="groom"
                        color="#D95D74"
                        uncheckedColor="#D95D74"
                      />
                      <Text onPress={() => setPayer("groom")}>Chú rể</Text>
                    </View>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginRight: 16,
                      }}
                    >
                      <RadioButton.Android
                        value="bride"
                        color="#D95D74"
                        uncheckedColor="#D95D74"
                      />
                      <Text onPress={() => setPayer("bride")}>Cô dâu</Text>
                    </View>
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <RadioButton.Android
                        value="both"
                        color="#D95D74"
                        uncheckedColor="#D95D74"
                      />
                      <Text onPress={() => setPayer("both")}>Quỹ chung</Text>
                    </View>
                  </View>
                </RadioButton.Group>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  appbarHeader: {
    backgroundColor: "#FEF0F3",
  },
  appbarTitle: {
    color: "#333",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 15,
    paddingTop: responsiveHeight(20),
  },
  section: {
    marginBottom: responsiveHeight(24),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(12),
  },
  sectionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#831843",
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: "#FFFFFF",
    fontFamily: "Montserrat-Regular",
  },
  textArea: {
    textAlignVertical: "top",
    height: responsiveHeight(150),
  },
  textInputOutline: {
    borderRadius: 12,
    borderColor: "#F9E2E7",
  },
  memberContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: responsiveWidth(10),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F9E2E7",
    marginBottom: responsiveHeight(10),
  },
  memberTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#333333",
  },
  memberDescription: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(10),
    color: "#6B7280",
  },
  memberListScroll: {
    maxHeight: responsiveHeight(300),
  },
  emptyMemberContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(32),
    borderRadius: 12,
    marginVertical: responsiveHeight(45),
  },
  emptyMemberText: {
    marginTop: 4,
    color: "#B0B0B0",
    fontSize: responsiveFont(13),
    fontFamily: "Montserrat-SemiBold",
  },
});
