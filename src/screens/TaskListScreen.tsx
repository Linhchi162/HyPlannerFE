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
import { selectCurrentUser } from "../store/authSlice";

type ListFooterProps = {
  modalVisible: boolean;
  setModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  showStartPicker: boolean;
  setShowStartPicker: React.Dispatch<React.SetStateAction<boolean>>;
  showEndPicker: boolean;
  setShowEndPicker: React.Dispatch<React.SetStateAction<boolean>>;
  startDate: Date | undefined;
  setStartDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  endDate: Date | undefined;
  setEndDate: React.Dispatch<React.SetStateAction<Date | undefined>>;
  lastPhaseEndDate: Date;
  formatDate: (dateString: string) => string;
  handleAddStage: () => void;
  loading?: boolean;
};

const ListFooter = memo(
  ({
    modalVisible,
    setModalVisible,
    showStartPicker,
    setShowStartPicker,
    showEndPicker,
    setShowEndPicker,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    lastPhaseEndDate,
    formatDate,
    handleAddStage,
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
            <Text style={styles.addStageButtonLabel}>Thêm giai đoạn</Text>
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
              <Text style={styles.modalTitle}>Thêm giai đoạn mới</Text>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={styles.datePickerButton}
              >
                <Text>
                  {startDate
                    ? `Ngày bắt đầu: ${formatDate(startDate.toISOString())}`
                    : "Chọn ngày bắt đầu"}
                </Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker
                  value={startDate || lastPhaseEndDate}
                  mode="date"
                  display="default"
                  minimumDate={lastPhaseEndDate}
                  onChange={(_, date) => {
                    setShowStartPicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}

              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={styles.datePickerButton}
              >
                <Text>
                  {endDate
                    ? `Ngày kết thúc: ${formatDate(endDate.toISOString())}`
                    : "Chọn ngày kết thúc"}
                </Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker
                  //lastPhaseEndDate + 2 days at value
                  value={
                    endDate ||
                    new Date(
                      lastPhaseEndDate.getTime() + 2 * 24 * 60 * 60 * 1000
                    )
                  }
                  mode="date"
                  display="default"
                  minimumDate={startDate || lastPhaseEndDate}
                  onChange={(_, date) => {
                    setShowEndPicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}

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
                  onPress={handleAddStage}
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

export default function TaskListScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [stages, setStages] = useState<any[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [expandedAccordions, setExpandedAccordions] = useState<string[]>([]);
  //Delete task confirmation
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  // Leave event confirmation
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  // State cho modal chi tiết công việc
  const [selectedTask, setSelectedTask] = useState<any>(null); // Task được chọn
  const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false); // Trạng thái hiển thị modal
  const dispatch = useDispatch<AppDispatch>();
  const phases = useSelector(
    (state: RootState) => state.phases.getPhases.phases
  );
  // const loading = useSelector((state: RootState) => state.phases.getPhases.isLoading);
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
  // const role: "participant" | "creator" = "creator"; // fix cứng tạm thời
  const creatorId = useSelector(
    (state: RootState) =>
      state.weddingEvent.getWeddingEvent.weddingEvent.creatorId
  );
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
  // Fetch phases từ API khi mount
  useEffect(() => {
    const fetchPhases = async () => {
      try {
        setLoading(true);
        await getPhases(eventId, dispatch);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching phases:", error);
      } finally {
        // setLoading(false);
      }
    };
    fetchPhases();
  }, [dispatch, eventId]);
  // if phases

  // Đồng bộ phases từ Redux sang stages để hiển thị
  useEffect(() => {
    const newStages = phases.map((phase, idx) => ({
      id: phase._id,
      title: `Giai đoạn ${idx + 1}: ${formatDate(
        phase.phaseTimeStart
      )} - ${formatDate(phase.phaseTimeEnd)}`,
      tasks: phase.tasks.map((task: any) => ({
        id: task._id,
        text: task.taskName,
        completed: task.completed,
        note: task.taskNote,
        assignee: task.member,
        // expectedBudget: task.expectedBudget,
        // actualBudget: task.actualBudget,
      })),
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
  }, [phases]);

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, "0")}.${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}.${date.getFullYear().toString().slice(-2)}`;
  }

  // Tính toán tiến độ công việc
  const totalTasks = stages.reduce((acc, stage) => acc + stage.tasks.length, 0);
  const completedTasks = stages.reduce(
    (acc, stage) =>
      acc +
      stage.tasks.filter((task: { completed: any }) => task.completed).length,
    0
  );
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const progressPercentage = (progress * 100).toFixed(1);
  // Tính toán ngân sách dự kiến và thực tế

  // Xử lý sự kiện mở/đóng accordion
  const handleAccordionPress = (id: string) => {
    setExpandedAccordions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Xử lý sự kiện chọn công việc
  const handleTaskToggle = async (taskId: string) => {
    let currentCompleted = false;
    for (const stage of stages) {
      const found = stage.tasks.find((task: any) => task.id === taskId);
      if (found) {
        currentCompleted = found.completed;
        break;
      }
    }
    await markTaskCompleted(taskId, !currentCompleted, dispatch);
    await getPhases(eventId, dispatch);
  };

  const handleAddStage = async () => {
    if (!startDate || !endDate) return;
    try {
      setActionLoading(true);
      await createPhase(
        eventId,
        {
          phaseTimeStart: startDate.toISOString(),
          phaseTimeEnd: endDate.toISOString(),
        },
        dispatch
      );
      setModalVisible(false);
      setStartDate(undefined);
      setEndDate(undefined);
      // Sau khi tạo thành công, tự động reload danh sách phases
      await getPhases(eventId, dispatch);
      setActionLoading(false);
    } catch (error) {
      // Xử lý lỗi nếu cần
      console.error("Error creating phase:", error);
    }
  };
  // Lấy ngày kết thúc của phase trước đó (nếu có)
  const lastPhaseEndDate =
    phases.length > 0
      ? new Date(phases[phases.length - 1].phaseTimeEnd)
      : new Date();

  const renderHiddenItem = (data: any, rowMap: any) => {
    const showConfirm = (taskId: string) => {
      setSelectedTaskId(taskId);
      setConfirmVisible(true);
    };

    const handleConfirmDelete = async () => {
      if (selectedTaskId) {
        setActionLoading(true);
        await deleteTask(selectedTaskId, dispatch);
        await getPhases(eventId, dispatch);
        setActionLoading(false);
        setConfirmVisible(false);
        setSelectedTaskId(null);
      }
    };

    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnLeft]}
          onPress={() =>
            navigation.navigate("EditTask", {
              taskId: data.item.id,
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
              <Text>Bạn có chắc chắn muốn xóa công việc này?</Text>
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
          titleStyle={[
            styles.taskText,
            task.completed && styles.taskTextCompleted,
          ]}
          style={{ paddingLeft: responsiveWidth(8) }}
          onPress={() => handleTaskDetail(task)} // tạm thời để vậy dự kiến sẽ thêm modal để xem chi tiết công việc
          left={() => (
            <RadioButton.Android
              value={task.id}
              status={task.completed ? "checked" : "unchecked"}
              onPress={() => handleTaskToggle(task.id)}
              color="#E9D0CB"
            />
          )}
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
            <Text style={styles.modalTitle}>Chi tiết công việc</Text>
            {selectedTask && (
              <>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Tên công việc: </Text>
                  {selectedTask.text}
                </Text>
                {/* Ghi chú */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Ghi chú: </Text>
                  {selectedTask.note || "Không có ghi chú"}
                </Text>
                {/* Trạng thái */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Trạng thái: </Text>
                  {selectedTask.completed ? "Đã hoàn thành" : "Chưa hoàn thành"}
                </Text>
                {/* <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Ngân sách dự kiến: </Text>
                  {selectedTask.expectedBudget ? selectedTask.expectedBudget.toLocaleString() + " VNĐ" : "Chưa có"}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Ngân sách thực tế: </Text>
                  {selectedTask.actualBudget ? selectedTask.actualBudget.toLocaleString() + " VNĐ" : "Chưa có"}
                </Text> */}
                {/* Người thực hiện */}
                <Text style={styles.modalText}>
                  <Text style={{ fontWeight: "bold" }}>Người thực hiện:</Text>
                </Text>
                {selectedTask.assignee.length > 0 ? (
                  <FlatList
                    data={selectedTask.assignee}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                      <View style={styles.assigneeContainer}>
                        <Image
                          source={{ uri: item.picture }}
                          style={styles.assigneeAvatar}
                        />
                        <View>
                          <Text style={styles.assigneeName}>
                            {item.fullName}
                          </Text>
                          <Text style={styles.assigneeEmail}>{item.email}</Text>
                        </View>
                      </View>
                    )}
                  />
                ) : (
                  <Text style={styles.modalText}>Không có người thực hiện</Text>
                )}
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
  type TaskListAppbarProps = {
    onBack: () => void;
    onAdd: () => void;
    onLeave?: () => void;
  };
  const TaskListAppbar = ({ onBack, onAdd, onLeave }: TaskListAppbarProps) => {
    return (
      <Appbar.Header style={styles.appbarHeader}>
        <TouchableOpacity
          onPress={onBack}
          style={{ padding: 8, marginRight: 8 }}
        >
          <Entypo name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Appbar.Content
          title="Danh sách công việc"
          titleStyle={styles.appbarTitle}
        />
        {userId === creatorId ? (
          <TouchableOpacity
            onPress={onAdd}
            style={{ padding: 8, marginRight: 8 }}
          >
            <Feather
              name="user-plus"
              size={24}
              color="#000000"
              style={{
                backgroundColor: "#edc2cbff",
                borderRadius: 8,
                padding: 7,
              }}
            />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onLeave}
            style={{ padding: 8, marginRight: 8 }}
          >
            <MaterialIcons
              name="exit-to-app"
              size={24}
              color="#000000"
              style={{
                backgroundColor: "#edc2cbff",
                borderRadius: 8,
                padding: 7,
              }}
            />
          </TouchableOpacity>
        )}
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
        description={`Tổng số công việc: ${stage.tasks.length}`}
        expanded={expandedAccordions.includes(stage.id)}
        onPress={() => handleAccordionPress(stage.id)}
        style={styles.accordion}
        titleStyle={styles.accordionTitle}
        descriptionStyle={styles.accordionDescription}
      >
        <SwipeListView
          data={stage.tasks}
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
            navigation.navigate("AddTask", {
              phaseId: stage.id,
              eventId: eventId,
            })
          }
        >
          <View style={styles.addTaskButton}>
            <Entypo name="plus" size={24} />
            <Text style={styles.addTaskButtonLabel}>Thêm công việc</Text>
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
          Không có giai đoạn nào.{"\n"}Bạn hãy thêm giai đoạn mới nhé !
        </Text>
      </View>
    );
  };

  const ListHeader = memo(() => (
    <>
      <View style={styles.progressSection}>
        <View>
          <ProgressBar
            progress={progress}
            color="#D95D74"
            style={styles.progressBar}
          />
          <View style={{ position: "absolute", right: -8, top: -6 }}>
            <Icon source="heart" color="#D95D74" size={24} />
          </View>
        </View>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Đã hoàn thành {progressPercentage}% ( Tổng {completedTasks}/
            {totalTasks} )
          </Text>
        </View>
      </View>
    </>
  ));

  const AddMemberModal = () => {
    const hashids = new Hashids(process.env.SECRET_KEY_SALT, 6);
    const inviteCode = hashids.encodeHex(eventId);
    const copyToClipboard = async () => {
      await Clipboard.setStringAsync(inviteCode);
      // alert('Đã sao chép link mời vào clipboard!');
    };
    return (
      <Modal
        visible={showAddMemberModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text
              style={[
                styles.modalTitle,
                { textAlign: "center", fontSize: responsiveFont(16) },
              ]}
            >
              Thêm thành viên
            </Text>
            {/* Nội dung thêm thành viên ở đây */}
            <Text style={styles.inviteDescription}>
              Bạn hãy sao chép link mời dưới đây và gửi cho bạn bè nhé:
            </Text>
            <View style={styles.linkWrapper}>
              <Text
                style={styles.inviteLinkText}
                numberOfLines={1}
                ellipsizeMode="tail" // Rút gọn ở cuối
              >
                {inviteCode}
              </Text>
              <TouchableOpacity
                onPress={copyToClipboard}
                style={styles.copyButton}
              >
                <MaterialIcons name="content-copy" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginVertical: responsiveHeight(10),
                paddingHorizontal: responsiveWidth(10),
              }}
            >
              <AntDesign
                name="exclamationcircleo"
                size={16}
                color="#D95D74"
                style={{ marginRight: 5, marginTop: 3 }}
              />
              <Text style={styles.noteText}>
                <Text style={{ fontWeight: "bold" }}>Lưu ý:</Text> Vui lòng chỉ
                chia sẻ link mời này với những người mà bạn tin tưởng!
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowAddMemberModal(false)}
              style={[styles.cancelButton, { width: "100%" }]}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const LeaveEventModal = () => {
    const [showError, setShowError] = useState(false);
    const [error, setError] = useState("");
    const handleLeaveEvent = async () => {
      try {
        await leaveWeddingEvent(eventId, userId, dispatch);
        setShowLeaveModal(false);
        navigation.navigate("JoinWedding"); // Quay lại màn hình nhập mã mời
      } catch (error: any) {
        setError(error);
        setShowError(true);
      }
    };
    return (
      <Portal>
        <Dialog
          visible={showLeaveModal}
          onDismiss={() => setShowLeaveModal(false)}
        >
          <Dialog.Title>Xác nhận rời khỏi sự kiện</Dialog.Title>
          <Dialog.Content>
            <Text>
              Bạn có chắc chắn muốn rời khỏi sự kiện này? Hành động này không
              thể hoàn tác.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLeaveModal(false)}>Hủy</Button>
            <Button onPress={handleLeaveEvent}>Xác nhận</Button>
          </Dialog.Actions>
        </Dialog>
        {/* báo lỗi */}
        <Dialog visible={showError} onDismiss={() => setShowError(false)}>
          <Dialog.Title>Thông báo</Dialog.Title>
          <Dialog.Content>
            <Text>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowError(false)}>Đóng</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  };

  return (
    <View style={styles.safeArea}>
      <TaskListAppbar
        onBack={() => navigation.goBack()}
        onAdd={() => setShowAddMemberModal(true)}
        onLeave={() => setShowLeaveModal(true)}
      />
      <AddMemberModal />
      <LeaveEventModal />
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
              showStartPicker={showStartPicker}
              setShowStartPicker={setShowStartPicker}
              showEndPicker={showEndPicker}
              setShowEndPicker={setShowEndPicker}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              lastPhaseEndDate={lastPhaseEndDate}
              formatDate={formatDate}
              handleAddStage={handleAddStage}
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
