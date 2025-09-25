import React, { memo, use, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import {
  Appbar,
  ProgressBar,
  Text,
  List,
  RadioButton,
  Icon,
  Portal,
  Dialog,
  Button,
} from "react-native-paper";
import { AntDesign, Entypo, Feather, MaterialIcons } from "@expo/vector-icons";
import { SwipeListView } from "react-native-swipe-list-view";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../assets/styles/utils/responsive";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigation/AppNavigator";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { createPhase, getPhases } from "../service/phaseService";
import * as Clipboard from "expo-clipboard";
import { deleteTask, markTaskCompleted } from "../service/taskService";
import {
  getWeddingEvent,
  leaveWeddingEvent,
} from "../service/weddingEventService";
import Hashids from "hashids";
import BudgetProgressBar from "../components/BudgetProgressBar";
import {
  createGroupActivity,
  getGroupActivities,
} from "../service/groupActivityService";
import { get } from "axios";
import { deleteActivity } from "../service/activityService";
import { selectCurrentUser } from "../store/authSlice";

type ListFooterProps = {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  groupName: string;
  setGroupName: React.Dispatch<React.SetStateAction<string>>;
  handleAddGroupActivity: () => void;
  loading?: boolean;
};
const ListFooter = memo(
  ({
    modalVisible,
    setModalVisible,
    groupName,
    setGroupName,
    handleAddGroupActivity,
    loading,
  }: ListFooterProps) => {
    return (
      <>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.addStageButton}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              alignSelf: "center",
            }}
          >
            <Entypo name="plus" size={24} />
            <Text style={styles.addStageButtonLabel}>Thêm nhóm ngân sách</Text>
          </View>
        </TouchableOpacity>
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Thêm nhóm ngân sách mới</Text>
              <TextInput
                placeholder="Tên nhóm ngân sách"
                value={groupName}
                onChangeText={setGroupName}
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginTop: 16,
                }}
              />
              <View
                style={[
                  styles.modalButtonRow,
                  { flexDirection: "row", justifyContent: "center" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={[styles.cancelButton, { flex: 1 }]}
                >
                  <Text style={{ color: "#fff", textAlign: "center" }}>
                    Hủy
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddGroupActivity}
                  style={[styles.addButton, { flex: 1 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", textAlign: "center" }}>
                      Thêm
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }
);

export default function BudgetListScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  //Delete task confirmation
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // Leave event confirmation
  // State cho modal chi tiết công việc
  const [selectedTask, setSelectedTask] = useState<any>(null); // Task được chọn
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false); // Trạng thái hiển thị modal
  const dispatch = useDispatch<AppDispatch>();
  const groupActivities = useSelector(
    (state: RootState) =>
      state.groupActivities.getGroupActivities.groupActivities
  );
  // const phaseLoading = useSelector((state: RootState) => state.phases.getPhases.isLoading);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // const userId = "6892b8a2aa0f1640e5c173f2"; //fix cứng tạm thời
  const user = useSelector(selectCurrentUser);
  if (!user) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
        }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>Đang tải thông tin...</Text>
        </View>
      </SafeAreaView>
    );
  }
  const userId = user.id || user._id;
  // Phần này sẽ bỏ vào trang home để fetch data về wedding info trước khi vào trang tasklist
  useEffect(() => {
    const fetchWeddingInfo = async () => {
      try {
        await getWeddingEvent(userId, dispatch);
      } catch (error) {
        console.error("Error fetching wedding info:", error);
      }
    };
    fetchWeddingInfo();
  }, [dispatch]);
  //////////////////////////////////////////////
  const eventId = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent._id
  );
  const totalBudget = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent.budget
  );
  // Fetch phases từ API khi mount
  useEffect(() => {
    const fetchAllActivities = async () => {
      setLoading(true);
      try {
        await getGroupActivities(eventId, dispatch);
      } catch (error) {
        console.error("Error fetching group activities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllActivities();
  }, [dispatch, eventId]);

  // Đồng bộ phases từ Redux sang stages để hiển thị
  useEffect(() => {
    const newStages = groupActivities.map((groupActivity, idx) => ({
      id: groupActivity._id,
      title: groupActivity.groupName,
      activities: groupActivity.activities.map((activity: any) => ({
        id: activity._id,
        text: activity.activityName,
        note: activity.activityNote,
        expectedBudget: activity.expectedBudget,
        actualBudget: activity.actualBudget,
        payer: activity.payer,
      })),
      totalExpectedBudget: groupActivity.activities.reduce(
        (acc: number, activity: any) => acc + (activity.expectedBudget || 0),
        0
      ),
      totalActualBudget: groupActivity.activities.reduce(
        (acc: number, activity: any) => acc + (activity.actualBudget || 0),
        0
      ),
    }));
    setStages(newStages);
    setExpandedAccordions((prev) => {
      const filtered = prev.filter((id) =>
        newStages.some((stage) => stage.id === id)
      );
      if (filtered.length > 0) return filtered;
      if (newStages.length > 0) return [newStages[0].id];
      return [];
    });
  }, [groupActivities]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getFullYear().toString().slice(-2)}`;
  }

  // Tính toán ngân sách dự kiến và thực tế
  const totalExpectedBudget = groupActivities.reduce(
    (acc, groupActivity) =>
      acc +
      groupActivity.activities.reduce(
        (activityAcc: number, activity: any) =>
          activityAcc + (activity.expectedBudget || 0),
        0
      ),
    0
  );

  const totalActualBudget = groupActivities.reduce(
    (acc, groupActivity) =>
      acc +
      groupActivity.activities.reduce(
        (activityAcc: number, activity: any) =>
          activityAcc + (activity.actualBudget || 0),
        0
      ),
    0
  );
  // Xử lý sự kiện mở/đóng accordion
  const handleAccordionPress = (id: string) => {
    setExpandedAccordions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddGroupActivity = async () => {
    if (!groupName.trim()) return;
    try {
      setActionLoading(true);
      await createGroupActivity(eventId, groupName, dispatch);
      setModalVisible(false);
      setGroupName("");
      // Sau khi tạo thành công, tự động reload danh sách phases
      await getGroupActivities(eventId, dispatch);
      setActionLoading(false);
    } catch (error) {
      // Xử lý lỗi nếu cần
      console.error("Error creating phase:", error);
    }
  };
  const renderHiddenItem = (data: any, rowMap: any) => {
    const showConfirm = (taskId: string) => {
      setSelectedTaskId(taskId);
      setConfirmVisible(true);
    };

    const handleConfirmDelete = async () => {
      if (selectedTaskId) {
        setActionLoading(true);
        await deleteActivity(selectedTaskId, dispatch);
        await getGroupActivities(eventId, dispatch);
        setConfirmVisible(false);
        setSelectedTaskId(null);
        setActionLoading(false);
      }
    };

    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnLeft]}
          onPress={() =>
            navigation.navigate("EditBudget", {
              activityId: data.item.id,
              eventId: eventId,
            })
          }
        >
          <Text style={styles.backTextWhite}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => showConfirm(data.item.id)}
        >
          <Text style={styles.backTextWhite}>Xóa</Text>
        </TouchableOpacity>
        <Portal>
          <Dialog
            visible={confirmVisible}
            onDismiss={() => setConfirmVisible(false)}
          >
            <Dialog.Title>Xác nhận xóa</Dialog.Title>
            <Dialog.Content>
              <Text>Bạn có chắc chắn muốn xóa ngân sách này?</Text>
            </Dialog.Content>
            <Dialog.Actions>
              {/* có thể thêm màu vào button sau */}
              <Button onPress={() => setConfirmVisible(false)}>Hủy</Button>
              <Button
                onPress={handleConfirmDelete}
                loading={actionLoading}
                disabled={actionLoading}
              >
                Xóa
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  };
  // Render từng công việc
  const renderTaskItem = (data: any, rowMap: any, stageId: string) => {
    const task = data.item;
    const handleTaskDetail = (task: any) => {
      setSelectedTask(task); // Lưu task được chọn
      setTaskDetailModalVisible(true); // Hiển thị modal
    };
    return (
      <View style={styles.rowFront}>
        <List.Item
          key={task.id}
          title={task.text}
          description={
            <>
              <Text
                style={{ color: "#7f7878ff", fontSize: responsiveFont(10) }}
              >
                Dự kiến:{" "}
                {task.expectedBudget
                  ? task.expectedBudget.toLocaleString() + "đ"
                  : 0 + "đ"}{" "}
                - Thực tế:{" "}
                {task.actualBudget
                  ? task.actualBudget.toLocaleString() + "đ"
                  : 0 + "đ"}
              </Text>
            </>
          }
          titleStyle={[
            styles.taskText,
            task.completed && styles.taskTextCompleted,
          ]}
          style={{ paddingLeft: responsiveWidth(8) }}
          onPress={() => handleTaskDetail(task)}
        />
      </View>
    );
  };
  // Modal hiển thị chi tiết công việc
  const RenderTaskDetailModal = () => {
    return (
      <Modal
        visible={taskDetailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTaskDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Chi tiết ngân sách</Text>
            {selectedTask && (
              <>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Tên ngân sách: </Text>
                  {selectedTask.text}
                </Text>
                {/* Ghi chú */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Ghi chú: </Text>
                  {selectedTask.note || "Không có ghi chú"}
                </Text>
                {/* Ngân sách dự kiến */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>
                    Ngân sách dự kiến:{" "}
                  </Text>
                  {selectedTask.expectedBudget
                    ? selectedTask.expectedBudget.toLocaleString() + " VNĐ"
                    : "Chưa có"}
                </Text>
                {/* Ngân sách thực tế */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>
                    Ngân sách thực tế:{" "}
                  </Text>
                  {selectedTask.actualBudget
                    ? selectedTask.actualBudget.toLocaleString() + " VNĐ"
                    : "Chưa có"}
                </Text>
                {/* Người chi trả */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Người chi trả: </Text>
                  {selectedTask.payer === "bride"
                    ? "Cô dâu"
                    : selectedTask.payer === "groom"
                    ? "Chú rể"
                    : "Quỹ chung"}
                </Text>
              </>
            )}
            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => setTaskDetailModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={{ color: "#fff", textAlign: "center" }}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  type BudgetListAppbarProps = {
    onBack: () => void;
  };
  const BudgetListAppbar = ({ onBack }: BudgetListAppbarProps) => {
    return (
      <Appbar.Header style={styles.appbarHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={{ padding: 8, marginRight: 8 }}
        >
          <Entypo name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Appbar.Content
          title="Danh sách ngân sách"
          titleStyle={styles.appbarTitle}
        />
      </Appbar.Header>
    );
  };

  const renderStage = ({ item: stage }: { item: any }) => (
    <View
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 1,
        marginBottom: 10,
      }}
    >
      <List.Accordion
        key={stage.id}
        title={stage.title}
        description={
          <>
            <Text>
              {`Dự kiến: ${stage.totalExpectedBudget.toLocaleString()}đ`} /{" "}
              {`Thực tế: ${stage.totalActualBudget.toLocaleString()}đ`}
            </Text>
          </>
        }
        expanded={expandedAccordions.includes(stage.id)}
        onPress={() => handleAccordionPress(stage.id)}
        style={styles.accordion}
        titleStyle={styles.accordionTitle}
        descriptionStyle={styles.accordionDescription}
      >
        <SwipeListView
          data={stage.activities}
          renderItem={(data, rowMap) => renderTaskItem(data, rowMap, stage.id)}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={-150}
          disableRightSwipe
          keyExtractor={(item: { id: string }) => item.id}
          contentContainerStyle={{ paddingBottom: 10 }}
          scrollEnabled={false}
        />
        <TouchableOpacity
          style={{ backgroundColor: "#FFF" }}
          onPress={() =>
            navigation.navigate("AddBudget", {
              groupActivityId: stage.id,
              eventId: eventId,
            })
          }
        >
          <View style={styles.addTaskButton}>
            <Entypo name="plus" size={24} />
            <Text style={styles.addTaskButtonLabel}>Thêm ngân sách</Text>
          </View>
        </TouchableOpacity>
      </List.Accordion>
    </View>
  );
  const PhaseEmpty = () => {
    return (
      <View style={styles.phaseEmptyContainer}>
        <Image
          source={require("../../assets/images/task_empty.jpg")}
          style={styles.phaseEmptyImage}
          resizeMode="cover"
        />
        <Text style={styles.phaseEmptyText}>
          Không có nhóm ngân sách nào.{"\n"}Bạn hãy thêm nhóm ngân sách mới nhé
          !
        </Text>
      </View>
    );
  };

  const ListHeader = memo(() => (
    <>
      <View style={styles.progressSection}>
        <BudgetProgressBar
          totalBudget={totalBudget}
          totalExpectedBudget={totalExpectedBudget}
          totalActualBudget={totalActualBudget}
        />
      </View>
    </>
  ));

  return (
    <View style={styles.safeArea}>
      <BudgetListAppbar onBack={() => navigation.goBack()} />
      <RenderTaskDetailModal />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D95D74" />
        </View>
      ) : (
        <FlatList
          data={stages}
          renderItem={renderStage}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={
            <ListFooter
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              groupName={groupName}
              setGroupName={setGroupName}
              handleAddGroupActivity={handleAddGroupActivity}
              loading={actionLoading}
            />
          }
          contentContainerStyle={styles.contentContainer}
          ListEmptyComponent={PhaseEmpty}
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
    elevation: 0,
    shadowOpacity: 0,
  },
  appbarTitle: {
    color: "#333",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    textAlign: "center",
    marginRight: responsiveWidth(40),
  },
  contentContainer: {
    padding: 16,
  },
  progressSection: {
    marginBottom: responsiveHeight(20),
  },
  progressInfo: {
    alignItems: "center",
    marginVertical: responsiveHeight(13),
  },
  progressText: {
    fontFamily: "Montserrat-Medium",
    color: "#333333",
    fontSize: responsiveFont(12),
  },
  progressBar: {
    height: responsiveHeight(10),
    borderRadius: 5,
    backgroundColor: "#F9E2E7",
  },
  listSection: {
    marginTop: 0,
  },
  accordion: {
    backgroundColor: "#FCFAF2",
  },
  accordionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    fontWeight: "700",
    color: "#333333",
  },
  accordionDescription: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(10),
    color: "#6B7280",
  },
  taskText: {
    fontFamily: "Montserrat-Regular",
    color: "#333333",
  },
  taskTextCompleted: {
    textDecorationLine: "line-through",
    color: "#A9A9A9",
  },
  addTaskButton: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(18),
  },
  addTaskButtonLabel: {
    fontSize: responsiveFont(14),
    marginLeft: responsiveWidth(4),
  },
  addStageButton: {
    marginTop: responsiveHeight(14),
    padding: responsiveHeight(18),
    borderRadius: 12,
    backgroundColor: "#FEF0F3",
    elevation: 2,
  },
  addStageButtonLabel: {
    fontSize: responsiveFont(14),
    textAlign: "center",
    marginLeft: 4,
  },
  rowFront: {
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderColor: "#F9E2E7",
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "#FFF",
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingLeft: responsiveWidth(15),
  },
  backRightBtn: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    position: "absolute",
    top: 0,
    width: 75,
  },
  backRightBtnLeft: {
    backgroundColor: "#EEB5C1",
    right: 75,
  },
  backRightBtnRight: {
    backgroundColor: "#E38EA0",
    right: 0,
  },
  backTextWhite: {
    color: "#FFF",
    fontFamily: "Montserrat-Medium",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "90%",
    elevation: 5,
  },
  modalTitle: {
    fontWeight: "bold",
    fontSize: responsiveFont(14),
    marginBottom: 12,
    textAlign: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#8a8485ff",
    paddingBottom: 8,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  modalButtonRow: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#8a8485ff",
    paddingTop: 12,
  },
  cancelButton: {
    padding: 10,
    backgroundColor: "#D95D74",
    borderRadius: 5,
    marginRight: 10,
  },
  addButton: {
    padding: 10,
    backgroundColor: "#219e3eff",
    borderRadius: 5,
  },
  phaseEmptyContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  phaseEmptyImage: {
    width: 300,
    height: 300,
  },
  phaseEmptyText: {
    fontSize: responsiveFont(14),
    color: "#888",
    fontFamily: "Montserrat-Medium",
    marginTop: 8,
    textAlign: "center",
  },
  copyButton: {
    backgroundColor: "#D95D74",
    paddingHorizontal: 15,
    justifyContent: "center",
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
  },
  linkWrapper: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    marginBottom: 10,
  },
  inviteLinkText: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    color: "#333",
    fontSize: 14,
  },
  inviteDescription: {
    marginVertical: 10,
    fontSize: 14,
    color: "#5b5858ff",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    zIndex: 1,
  },
  modalText: {
    fontSize: responsiveFont(12),
    marginBottom: 10,
  },
  noteText: {
    fontSize: responsiveFont(10),
    color: "#5b5858ff",
  },
  assigneeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  assigneeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  assigneeName: {
    fontSize: responsiveFont(12),
    fontWeight: "bold",
    color: "#333",
  },
  assigneeEmail: {
    fontSize: responsiveFont(10),
    color: "#6B7280",
  },
});
