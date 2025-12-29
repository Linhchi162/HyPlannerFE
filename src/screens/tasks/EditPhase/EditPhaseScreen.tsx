import React, { use, useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import {
  Appbar,
  Dialog,
  Portal,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { SwipeListView } from "react-native-swipe-list-view";
import EditPhaseModal from "./EditPhaseModal";
import { RootStackParamList } from "../../../navigation/types";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../../assets/styles/utils/responsive";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import {
  deletePhase,
  getPhases,
  updatePhase,
} from "../../../service/phaseService";
import logger from "../../../utils/logger";

interface Phase {
  _id: string;
  phaseTimeStart: string;
  phaseTimeEnd: string;
}

interface EditPhaseAppBarProps {
  onBack?: () => void;
  onDeleteAll?: () => void;
}

const EditPhaseAppBar = ({ onBack, onDeleteAll }: EditPhaseAppBarProps) => {
  return (
    <Appbar.Header style={styles.appbarHeader}>
      <TouchableOpacity
        onPress={onBack}
        style={{ padding: responsiveWidth(8), marginRight: responsiveWidth(8) }}
      >
        <Entypo
          name="chevron-left"
          size={responsiveWidth(24)}
          color="#000000"
        />
      </TouchableOpacity>
      <Appbar.Content
        title="Chỉnh sửa giai đoạn"
        titleStyle={styles.appbarTitle}
      />
      <TouchableOpacity
        onPress={onDeleteAll}
        style={{ padding: responsiveWidth(8), marginLeft: responsiveWidth(8) }}
      >
        <MaterialIcons
          name="delete"
          size={responsiveWidth(24)}
          color="#D95D74"
        />
      </TouchableOpacity>
    </Appbar.Header>
  );
};

function EditPhaseScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [phaseToDelete, setPhaseToDelete] = useState<string | null>(null);
  const [deleteAllDialogVisible, setDeleteAllDialogVisible] = useState(false);

  // take data from redux
  const [phases, setPhases] = useState<Phase[]>([]);
  const [adjustedPhases, setAdjustedPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(false);
  const route = useRoute<RouteProp<RootStackParamList, "EditPhaseScreen">>();
  const dispatch = useDispatch<AppDispatch>();

  // task from params
  // const phasesData = route.params.phases;
  const eventId = route.params.eventId;
  const createdAt = route.params.createdAt;
  const createdAtDate = createdAt ? new Date(createdAt) : new Date();
  const phasesData = useSelector(
    (state: RootState) => state.phases.getPhases.phases
  );
  const weddingEvent = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent
  );
  useEffect(() => {
    if (eventId) {
      getPhases(eventId, dispatch);
    }
  }, [eventId, dispatch]);
  useEffect(() => {
    if (phasesData) {
      setPhases(phasesData);
    }
  }, [phasesData]);

  // Convert data for SwipeListView
  const listData = phases.map((phase, index) => ({
    key: phase._id,
    ...phase,
    index,
  }));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  };

  const formatWeddingDate = () => {
    if (!weddingEvent?.timeToMarried) return undefined;
    const weddingDate = new Date(weddingEvent.timeToMarried);
    return formatShortDate(weddingDate);
  };

  const handleEdit = (phase: Phase) => {
    setSelectedPhase(phase);
    setEditStartDate(formatDate(phase.phaseTimeStart));
    setEditEndDate(formatDate(phase.phaseTimeEnd));
    setModalVisible(true);
  };

  const handleDelete = (phaseId: string) => {
    setPhaseToDelete(phaseId);
    setDeleteDialogVisible(true);
  };

  const confirmDelete = async () => {
    if (phaseToDelete && eventId) {
      try {
        setLoading(true);
        await deletePhase(phaseToDelete, dispatch);
        await getPhases(eventId, dispatch); // Lấy lại danh sách phase mới nhất
        setLoading(false);
      } catch (error) {
        // Có thể show thông báo lỗi ở đây
        logger.error(error);
      }
      setDeleteDialogVisible(false);
      setPhaseToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogVisible(false);
    setPhaseToDelete(null);
  };

  const handleDeleteAll = () => {
    setDeleteAllDialogVisible(true);
  };

  const confirmDeleteAll = async () => {
    if (eventId && phases.length > 0) {
      try {
        setLoading(true);
        // Xóa tất cả các phase
        for (const phase of phases) {
          await deletePhase(phase._id, dispatch);
        }
        await getPhases(eventId, dispatch); // Lấy lại danh sách phase mới nhất
        setLoading(false);
        setDeleteAllDialogVisible(false);
      } catch (error) {
        logger.error(error);
        alert("Có lỗi xảy ra khi xóa tất cả giai đoạn.");
        setLoading(false);
      }
    }
  };

  const cancelDeleteAll = () => {
    setDeleteAllDialogVisible(false);
  };

  const handleSaveEdit = async () => {
    if (selectedPhase && eventId) {
      try {
        setLoading(true);
        // Chuyển đổi ngày về ISO string nếu cần
        const [startDay, startMonth, startYear] = editStartDate.split("/");
        const [endDay, endMonth, endYear] = editEndDate.split("/");

        const phaseTimeStart = new Date(
          Date.UTC(
            2000 + Number(startYear), // hoặc Number('20' + startYear) nếu startYear là 2 số
            Number(startMonth) - 1,
            Number(startDay)
          )
        ).toISOString();

        const phaseTimeEnd = new Date(
          Date.UTC(2000 + Number(endYear), Number(endMonth) - 1, Number(endDay))
        ).toISOString();

        // Cập nhật phase hiện tại
        await updatePhase(
          selectedPhase._id,
          { phaseTimeStart, phaseTimeEnd },
          dispatch
        );

        // Nếu có adjustedPhases, cập nhật các phases sau
        if (adjustedPhases.length > 0) {
          const currentIndex = phases.findIndex(
            (p) => p._id === selectedPhase._id
          );

          // Chỉ cập nhật các phases sau current phase
          for (let i = currentIndex + 1; i < adjustedPhases.length; i++) {
            const adjustedPhase = adjustedPhases[i];
            await updatePhase(
              adjustedPhase._id,
              {
                phaseTimeStart: adjustedPhase.phaseTimeStart,
                phaseTimeEnd: adjustedPhase.phaseTimeEnd,
              },
              dispatch
            );
          }
        }

        await getPhases(eventId, dispatch); // Lấy lại danh sách phase mới nhất
        setAdjustedPhases([]); // Reset adjustedPhases
        setLoading(false);
      } catch (error) {
        // Có thể show thông báo lỗi ở đây
        alert("Có lỗi xảy ra khi cập nhật giai đoạn.");
        logger.error(error);
      }
      setModalVisible(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.rowFront}>
        <View style={styles.phaseCard}>
          <Text style={styles.phaseTitle}>
            {/* Giai đoạn {item.index + 1}: {formatDate(item.phaseTimeStart)} -{" "} */}
            Giai đoạn {item.index + 1}
          </Text>
        </View>
      </View>
    );
  };

  const renderHiddenItem = ({ item }: { item: any }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnLeft]}
        onPress={() => handleEdit(item)}
      >
        <Text style={styles.backTextWhite}>Sửa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.backRightBtn, styles.backRightBtnRight]}
        onPress={() => handleDelete(item._id)}
      >
        <Text style={styles.backTextWhite}>Xóa</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.safeArea}>
      <EditPhaseAppBar
        onBack={() => navigation.goBack()}
        onDeleteAll={handleDeleteAll}
      />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D95D74" />
        </View>
      ) : (
        <>
          <SwipeListView
            data={listData}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-150}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            disableRightSwipe
          />

          <EditPhaseModal
            isFirstPhase={true}
            projectStartDate={createdAt ? formatShortDate(createdAtDate) : ""}
            weddingDate={formatWeddingDate()}
            allPhases={phases}
            onPhasesAdjusted={setAdjustedPhases}
            visible={modalVisible}
            phase={selectedPhase}
            startDate={editStartDate}
            endDate={editEndDate}
            onStartDateChange={setEditStartDate}
            onEndDateChange={setEditEndDate}
            onSave={handleSaveEdit}
            onCancel={() => setModalVisible(false)}
            loading={loading}
          />
        </>
      )}
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={cancelDelete}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Xác nhận xóa</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              Bạn có chắc chắn muốn xóa giai đoạn này?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={cancelDelete}
              textColor="#666"
              style={styles.cancelButton}
            >
              Hủy
            </Button>
            <Button
              onPress={confirmDelete}
              buttonColor="#D95D74"
              mode="contained"
              style={styles.deleteButton}
              disabled={loading}
              loading={loading}
            >
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete All Confirmation Dialog */}
        <Dialog
          visible={deleteAllDialogVisible}
          onDismiss={cancelDeleteAll}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>
            Xác nhận xóa tất cả
          </Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogContent}>
              Bạn có chắc chắn muốn xóa tất cả {phases.length} giai đoạn? Hành
              động này không thể hoàn tác.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={cancelDeleteAll}
              textColor="#666"
              style={styles.cancelButton}
            >
              Hủy
            </Button>
            <Button
              onPress={confirmDeleteAll}
              buttonColor="#D95D74"
              mode="contained"
              style={styles.deleteButton}
              disabled={loading}
              loading={loading}
            >
              Xóa tất cả
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
    marginRight: responsiveWidth(30),
  },
  listContainer: {
    padding: responsiveWidth(13),
  },
  rowFront: {
    backgroundColor: "transparent",
  },
  phaseCard: {
    backgroundColor: "#F9F9F9",
    borderRadius: 7,
    padding: responsiveWidth(15),
    marginBottom: responsiveHeight(12),
    borderLeftWidth: 4,
    borderLeftColor: "#D95D74",
  },
  phaseTitle: {
    fontSize: responsiveFont(13),
    fontWeight: "600",
    color: "#333",
  },
  rowBack: {
    alignItems: "center",
    backgroundColor: "transparent",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(13),
    borderRadius: 12,
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
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  backRightBtnRight: {
    backgroundColor: "#E38EA0",
    right: 0,
    borderTopRightRadius: 7,
    borderBottomRightRadius: 7,
  },
  backTextWhite: {
    color: "#FFF",
    fontSize: responsiveFont(10),
    fontFamily: "Montserrat-SemiBold",
  },
  dialog: {
    backgroundColor: "white",
    borderRadius: 12,
  },
  dialogTitle: {
    color: "#333",
    fontSize: responsiveFont(14),
    fontWeight: "600",
    fontFamily: "Montserrat-SemiBold",
  },
  dialogContent: {
    color: "#666",
    fontSize: responsiveFont(14),
    lineHeight: responsiveHeight(24),
    fontFamily: "Montserrat-Regular",
  },
  dialogActions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cancelButton: {
    marginRight: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
  },
  deleteButton: {
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default EditPhaseScreen;
