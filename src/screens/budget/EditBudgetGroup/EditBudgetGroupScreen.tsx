import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Appbar, Text, Portal, Dialog, Button } from "react-native-paper";
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../../assets/styles/utils/responsive";
import {
  NavigationProp,
  RouteProp,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/types";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store";
import {
  deleteGroupActivity,
  getGroupActivities,
  updateGroupActivity,
} from "../../../service/groupActivityService";
import { SwipeListView } from "react-native-swipe-list-view";
import { MixpanelService } from "../../../service/mixpanelService";

type EditBudgetGroupScreenRouteProp = RouteProp<
  RootStackParamList,
  "EditBudgetGroupScreen"
>;

export default function EditBudgetGroupScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<EditBudgetGroupScreenRouteProp>();
  const { eventId } = route.params;
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const dispatch = useDispatch<AppDispatch>();

  const groupActivities = useSelector(
    (state: RootState) =>
      state.groupActivities.getGroupActivities.groupActivities
  );

  const [loading, setLoading] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState("");
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [confirmDeleteAllVisible, setConfirmDeleteAllVisible] = useState(false);

  useEffect(() => {
    MixpanelService.track("Viewed Edit Budget Groups");
  }, []);

  useEffect(() => {
    const fetchGroupActivities = async () => {
      setLoading(true);
      try {
        await getGroupActivities(eventId, dispatch);
      } catch (error) {
        console.error("Error fetching group activities:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchGroupActivities();
  }, [dispatch, eventId]);

  const handleStartEdit = (groupId: string, groupName: string) => {
    setEditingGroupId(groupId);
    setEditingGroupName(groupName);
  };

  const handleSaveEdit = async () => {
    if (!editingGroupId || !editingGroupName.trim()) return;

    setLoading(true);
    try {
      await updateGroupActivity(editingGroupId, editingGroupName, dispatch);
      MixpanelService.track("Updated Budget Group", {
        "Group ID": editingGroupId,
        "New Name": editingGroupName,
      });
      await getGroupActivities(eventId, dispatch);
      setEditingGroupId(null);
      setEditingGroupName("");
    } catch (error) {
      console.error("Error updating group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingGroupName("");
  };

  const showDeleteConfirm = (groupId: string) => {
    setSelectedGroupId(groupId);
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGroupId) return;

    setLoading(true);
    try {
      await deleteGroupActivity(selectedGroupId, dispatch);
      MixpanelService.track("Deleted Budget Group", {
        "Group ID": selectedGroupId,
      });
      await getGroupActivities(eventId, dispatch);
      setConfirmDeleteVisible(false);
      setSelectedGroupId(null);
    } catch (error) {
      console.error("Error deleting group:", error);
    } finally {
      setLoading(false);
    }
  };

  const showDeleteAllConfirm = () => {
    setConfirmDeleteAllVisible(true);
  };

  const handleConfirmDeleteAll = async () => {
    setLoading(true);
    try {
      for (const group of groupActivities) {
        await deleteGroupActivity(group._id, dispatch);
      }
      MixpanelService.track("Deleted All Budget Groups", {
        "Groups Deleted": groupActivities.length,
      });
      await getGroupActivities(eventId, dispatch);
      setConfirmDeleteAllVisible(false);
    } catch (error) {
      console.error("Error deleting all groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderHiddenItem = (data: any) => {
    return (
      <View style={styles.rowBack}>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnLeft]}
          onPress={() => handleStartEdit(data.item._id, data.item.groupName)}
        >
          <Text style={styles.backTextWhite}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backRightBtn, styles.backRightBtnRight]}
          onPress={() => showDeleteConfirm(data.item._id)}
        >
          <Text style={styles.backTextWhite}>Xóa</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = (data: any) => {
    const group = data.item;
    const isEditing = editingGroupId === group._id;

    return (
      <View style={styles.rowFront}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              value={editingGroupName}
              onChangeText={setEditingGroupName}
              style={styles.editInput}
              autoFocus
            />
            <View style={styles.editButtons}>
              <TouchableOpacity
                onPress={handleSaveEdit}
                style={styles.saveButton}
              >
                <Entypo name="check" size={responsiveWidth(20)} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelEdit}
                style={styles.cancelButton}
              >
                <Entypo name="cross" size={responsiveWidth(20)} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.groupItem}>
            <Text style={styles.groupName}>{group.groupName}</Text>
            <Text style={styles.groupCount}>
              {group.activities.length} mục ngân sách
            </Text>
          </View>
        )}
      </View>
    );
  };

  const EditBudgetGroupAppbar = () => {
    return (
      <Appbar.Header style={styles.appbarHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            padding: responsiveWidth(8),
            marginRight: responsiveWidth(8),
          }}
        >
          <Entypo
            name="chevron-left"
            size={responsiveWidth(24)}
            color="#000000"
          />
        </TouchableOpacity>
        <Appbar.Content
          title="Chỉnh sửa nhóm ngân sách"
          titleStyle={styles.appbarTitle}
        />
        {groupActivities.length > 0 && (
          <TouchableOpacity
            onPress={showDeleteAllConfirm}
            style={{
              padding: responsiveWidth(8),
              marginRight: responsiveWidth(8),
            }}
          >
            <MaterialIcons
              name="delete"
              size={responsiveWidth(24)}
              color="#D95D74"
            />
          </TouchableOpacity>
        )}
      </Appbar.Header>
    );
  };

  return (
    <View style={styles.safeArea}>
      <EditBudgetGroupAppbar />
      {loading ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D95D74" />
        </View>
      ) : (
        <SwipeListView
          data={groupActivities}
          renderItem={renderItem}
          renderHiddenItem={renderHiddenItem}
          rightOpenValue={responsiveWidth(-150)}
          disableRightSwipe
          keyExtractor={(item: any) => item._id}
          contentContainerStyle={[
            styles.contentContainer,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? responsiveHeight(16) + insets.bottom
                  : responsiveHeight(16),
            },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có nhóm ngân sách nào</Text>
            </View>
          }
        />
      )}

      <Portal>
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
        >
          <Dialog.Title>Xác nhận xóa</Dialog.Title>
          <Dialog.Content>
            <Text>
              Bạn có chắc chắn muốn xóa nhóm ngân sách này? Tất cả các mục ngân
              sách trong nhóm cũng sẽ bị xóa.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteVisible(false)}>Hủy</Button>
            <Button onPress={handleConfirmDelete} loading={loading}>
              Xóa
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={confirmDeleteAllVisible}
          onDismiss={() => setConfirmDeleteAllVisible(false)}
        >
          <Dialog.Title>Xác nhận xóa tất cả</Dialog.Title>
          <Dialog.Content>
            <Text>
              Bạn có chắc chắn muốn xóa TẤT CẢ {groupActivities.length} nhóm
              ngân sách? Hành động này không thể hoàn tác.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteAllVisible(false)}>
              Hủy
            </Button>
            <Button onPress={handleConfirmDeleteAll} loading={loading}>
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
    minHeight: responsiveHeight(60),
  },
  appbarTitle: {
    color: "#333",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    fontWeight: "700",
    textAlign: "center",
    lineHeight: responsiveFont(24),
    minHeight: responsiveHeight(30),
  },
  contentContainer: {
    padding: responsiveWidth(16),
  },
  rowFront: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: responsiveWidth(1),
    borderBottomColor: "#F9E2E7",
    justifyContent: "center",
    paddingVertical: responsiveHeight(16),
    paddingHorizontal: responsiveWidth(16),
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
    width: responsiveWidth(75),
  },
  backRightBtnLeft: {
    backgroundColor: "#EEB5C1",
    right: responsiveWidth(75),
  },
  backRightBtnRight: {
    backgroundColor: "#E38EA0",
    right: 0,
  },
  backTextWhite: {
    color: "#FFF",
    fontFamily: "Montserrat-Medium",
    fontWeight: "600",
    fontSize: responsiveFont(14),
  },
  groupItem: {
    flex: 1,
  },
  groupName: {
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-SemiBold",
    color: "#333",
    marginBottom: responsiveHeight(4),
    lineHeight: responsiveFont(22),
  },
  groupCount: {
    fontSize: responsiveFont(12),
    fontFamily: "Montserrat-Regular",
    color: "#6B7280",
    lineHeight: responsiveFont(18),
  },
  editContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  editInput: {
    flex: 1,
    borderWidth: responsiveWidth(1),
    borderColor: "#D95D74",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(12),
    paddingVertical: responsiveHeight(8),
    fontSize: responsiveFont(16),
    fontFamily: "Montserrat-Regular",
  },
  editButtons: {
    flexDirection: "row",
    gap: responsiveWidth(8),
  },
  saveButton: {
    backgroundColor: "#4CAF50",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(8),
  },
  cancelButton: {
    backgroundColor: "#D95D74",
    borderRadius: responsiveWidth(8),
    padding: responsiveWidth(8),
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: responsiveHeight(40),
  },
  emptyText: {
    fontSize: responsiveFont(14),
    color: "#888",
    fontFamily: "Montserrat-Medium",
    lineHeight: responsiveFont(20),
  },
});
