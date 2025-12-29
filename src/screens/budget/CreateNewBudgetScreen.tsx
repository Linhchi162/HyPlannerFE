import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Icon,
  IconButton,
  List,
  RadioButton,
  TextInput,
} from "react-native-paper";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import { useCallback, useState, useEffect } from "react";
import React from "react";
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
import { RootStackParamList } from "../../navigation/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { createActivity } from "../../service/activityService";
import { getGroupActivities } from "../../service/groupActivityService";
import { MixpanelService } from "../../service/mixpanelService";
type CreateTaskAppbarProps = {
  onBack: () => void;
  onCheck: () => void;
  loading?: boolean;
};

// Component Appbar riêng, dùng React.memo để tránh re-render
const CreateTaskAppbar = React.memo(
  ({ onBack, onCheck, loading }: CreateTaskAppbarProps) => (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
        <Entypo name="chevron-left" size={24} color="#000000" />
      </TouchableOpacity>
      <Appbar.Content
        title="Tạo ngân sách mới"
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

export default function CreateNewBudgetScreen() {
  const [activityName, setActivityName] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [activityNameError, setActivityNameError] = useState("");
  const [payer, setPayer] = useState<string>("both");
  const [expectedBudget, setExpectedBudget] = useState<number | null>(null); // Giá trị ban đầu là null
  const [actualBudget, setActualBudget] = useState<number | null>(null);
  // const [budgetError, setBudgetError] = useState<string>(""); // Lưu thông báo lỗi

  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();
  // take groupActivityId from route params
  const route = useRoute<RouteProp<RootStackParamList, "AddBudget">>();
  const { groupActivityId } = route.params;
  const { eventId } = route.params;
  const [actionLoading, setActionLoading] = useState(false);
  // const eventId = "68c29283931d7e65bd3ad689"; // lưu ý đây là fix cứng tạm thời sau khi hoàn thành login và chọn sự kiện
  // const userId = "6892b8a2aa0f1640e5c173f2"; //fix cứng tạm thời
  // const creatorId = useSelector((state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent.creatorId);

  useEffect(() => {
    MixpanelService.track("Viewed Add Budget Screen");
  }, []);

  const handleCreateBudget = async () => {
    try {
      if (activityName.trim() === "") {
        setActivityNameError("Tên ngân sách không được để trống");
        return;
      }
      setActivityNameError("");
      // Call API
      const activityData = {
        activityName: activityName,
        activityNote: activityNote,
        expectedBudget: expectedBudget === null ? 0 : expectedBudget, // Nếu expectedBudget là null, gửi 0
        actualBudget: actualBudget === null ? 0 : actualBudget, // Nếu actualBudget là null, gửi 0
        payer: payer,
      };
      setActionLoading(true);
      await createActivity(groupActivityId, activityData, dispatch);
      await getGroupActivities(eventId, dispatch);
      setActionLoading(false);
      MixpanelService.track("Added Budget Item", {
        "Budget Name": activityName,
        "Group ID": groupActivityId,
        "Expected Amount": activityData.expectedBudget,
        "Actual Amount": activityData.actualBudget,
        Payer: payer,
        "Has Note": activityNote.trim().length > 0,
      });
      // Navigate back to BudgetList after creation
      navigation.goBack();
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  return (
    <View style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <CreateTaskAppbar
          onBack={navigation.goBack}
          onCheck={handleCreateBudget}
          loading={actionLoading}
        />
        <FlatList
          data={[]} // Không có dữ liệu, chỉ dùng để hiển thị nội dung
          keyExtractor={(_, index) => index.toString()}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={[styles.scrollView, styles.contentContainer]}>
              {/* Phần Tên công việc */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon source="heart" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Tên ngân sách*</Text>
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
                  error={activityName.trim() === ""}
                />
                {activityNameError && (
                  <Text style={{ color: "red", marginTop: 4, marginLeft: 4 }}>
                    {activityNameError}
                  </Text>
                )}
              </View>

              {/* Phần Ghi chú */}
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
              {/* Phần Ngân sách dự kiến và thực tế */}
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
                {/* {budgetError && (
                                    <Text style={{ color: 'red', marginTop: 4, marginLeft: 4 }}>{budgetError}</Text>
                                )} */}
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
              {/* Phần Người thanh toán */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <FontAwesome5 name="user" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Người chi trả</Text>
                </View>
                <RadioButton.Group
                  onValueChange={(value) => setPayer(value)}
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
      </KeyboardAvoidingView>
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
    paddingTop: responsiveHeight(18),
  },
  section: {
    marginBottom: responsiveHeight(24),
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(10),
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
});
