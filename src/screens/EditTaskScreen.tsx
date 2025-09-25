import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Appbar, Avatar, Icon, IconButton, List, TextInput } from "react-native-paper";
import { Entypo, FontAwesome5 } from "@expo/vector-icons";
import { responsiveFont, responsiveHeight, responsiveWidth } from "../../assets/styles/utils/responsive";
import { NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { editTask, getTasks } from "../service/taskService";
import { getPhases } from "../service/phaseService";
import { Member } from "../store/weddingEventSlice";
import { RootStackParamList } from "../navigation/AppNavigator";

type CreateTaskAppbarProps = {
  onBack: () => void;
  onCheck: () => void;
};

const CreateTaskAppbar = React.memo(({ onBack, onCheck }: CreateTaskAppbarProps) => (
  <Appbar.Header style={styles.appbarHeader}>
    <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
      <Entypo name="chevron-left" size={24} color="#000000" />
    </TouchableOpacity>
    <Appbar.Content title="Chỉnh sửa công việc" titleStyle={styles.appbarTitle} />
    <TouchableOpacity onPress={onCheck} style={{ padding: 8, marginRight: 8 }}>
      <Entypo name="check" size={24} color="#000000" />
    </TouchableOpacity>
  </Appbar.Header>
));

export const EmptyMemberComponent = () => (
  <View style={styles.emptyMemberContainer}>
    <FontAwesome5 name="user-friends" size={36} color="#F9CBD6" style={{ marginBottom: 8 }} />
    <Text style={styles.emptyMemberText}>Không có thành viên nào.</Text>
  </View>
);

export default function EditTaskScreen() {
  const [taskName, setTaskName] = useState("");
  const [notes, setNotes] = useState("");
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "EditTask">>();
  const { taskId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const task = useSelector((state: RootState) => state.tasks.getTaskInfo.task);
  const memberInTask = useSelector((state: RootState) => state.tasks.getTaskInfo.task?.member) || [];
  // const [expectedBudget, setExpectedBudget] = useState<number | null>(null); // Giá trị ban đầu là null
  // const [actualBudget, setActualBudget] = useState<number | null>(null);
  // const [budgetError, setBudgetError] = useState<string>("");
  const [taskNameError, setTaskNameError] = useState('');
  const [members, setMembers] = useState<Member[]>(memberInTask);
  const eventId = "68c29283931d7e65bd3ad689"; // Fix cứng tạm thời
  const [loadingTask, setLoadingTask] = useState(false);
  // const userId = "6892b8a2aa0f1640e5c173f2"; //fix cứng tạm thời
  // const creatorId = useSelector((state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent.creatorId);
  useEffect(() => {
    setMembers(memberInTask);
  }, [memberInTask]);

  useEffect(() => {
    const fetchTask = async () => {
      setLoadingTask(true);
      try {
        await getTasks(taskId, dispatch);
      } catch (error) {
        console.error("Error fetching task:", error);
      } finally {
        setLoadingTask(false);
      }
    };
    fetchTask();
  }, [taskId, dispatch]);

  useEffect(() => {
    if (task) {
      setTaskName(task.taskName || "");
      setNotes(task.taskNote || "");
      // setExpectedBudget(task.expectedBudget || null);
      // setActualBudget(task.actualBudget || null);
    }
  }, [task]);

  const handleSave = async () => {
    try {
      if (taskName.trim() === '') {
        setTaskNameError('Tên công việc không được để trống');
        return;
      } setTaskNameError('');
      await editTask(
        taskId,
        {
          taskName,
          taskNote: notes,
          member: members.map(m => m._id),
          // expectedBudget: expectedBudget === null ? 0 : expectedBudget,
          // actualBudget: actualBudget === null ? 0 : actualBudget,
        },
        dispatch
      );
      await getPhases(eventId, dispatch);
      navigation.goBack();
    } catch (error) {
      console.error("Error saving task:", error);
    }
  };
  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  return (
    <View style={styles.safeArea}>
      <CreateTaskAppbar onBack={navigation.goBack} onCheck={handleSave} />
      {loadingTask ? (
        <ActivityIndicator size="large" color="#D95D74" />
      ) : (
        <FlatList
          data={[]} // Không có dữ liệu, chỉ dùng để hiển thị nội dung
          keyExtractor={(_, index) => index.toString()}
          renderItem={() => null}
          ListHeaderComponent={
            <View style={[styles.scrollView, styles.contentContainer]}>
              {/* Tên công việc */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon source="heart" color="#F9CBD6" size={24} />
                  <Text style={styles.sectionTitle}>Tên công việc</Text>
                </View>
                <TextInput
                  mode="outlined"
                  placeholder="Nhập tên công việc"
                  value={taskName}
                  onChangeText={setTaskName}
                  style={styles.textInput}
                  outlineStyle={styles.textInputOutline}
                  theme={{
                    colors: {
                      primary: "#D95D74",
                      onSurfaceVariant: "#AAAAAA",
                    },
                  }}
                />
                {taskNameError && (
                  <Text style={{ color: 'red', marginTop: 4, marginLeft: 4 }}>{taskNameError}</Text>
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
                  value={notes}
                  onChangeText={setNotes}
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
              {/* {userId === creatorId && (
                <>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome5 name="coins" color="#F9CBD6" size={24} />
                      <Text style={styles.sectionTitle}>Ngân sách dự kiến</Text>
                    </View>
                    <TextInput
                      mode="outlined"
                      placeholder="Nhập ngân sách dự kiến"
                      value={expectedBudget !== null ? formatNumber(expectedBudget) : ""}
                      onChangeText={(value) => {
                        if (value === "") {
                          setExpectedBudget(null);
                        } else {
                          const numericValue = parseInt(value.replace(/\./g, ""), 10);
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
                          primary: '#D95D74',
                          onSurfaceVariant: '#AAAAAA',
                        },
                      }}
                    />
                    {budgetError && (
                      <Text style={{ color: 'red', marginTop: 4, marginLeft: 4 }}>{budgetError}</Text>
                    )}
                  </View>
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome5 name="coins" color="#F9CBD6" size={24} />
                      <Text style={styles.sectionTitle}>Ngân sách thực tế</Text>
                    </View>
                    <TextInput
                      mode="outlined"
                      placeholder="Nhập ngân sách thực tế"
                      value={actualBudget !== null ? formatNumber(actualBudget) : ""}
                      onChangeText={(value) => {
                        if (value === "") {
                          setActualBudget(null);
                        } else {
                          const numericValue = parseInt(value.replace(/\./g, ""), 10);
                          if (!isNaN(numericValue)) {
                            setActualBudget(numericValue);
                          }
                        }
                      }}
                      style={[styles.textInput]}
                      outlineStyle={styles.textInputOutline}
                      theme={{
                        colors: {
                          primary: '#D95D74',
                          onSurfaceVariant: '#AAAAAA',
                        },
                      }}
                    />
                  </View>
                </>
              )} */}

              {/* Thành viên đảm nhận */}
              <View style={styles.section}>
                <View style={[styles.sectionHeader, { justifyContent: "space-between" }]}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Icon source="account-group" color="#F9CBD6" size={24} />
                    <Text style={styles.sectionTitle}>Thành viên đảm nhận</Text>
                  </View>
                  <IconButton
                    icon="plus"
                    iconColor="#FF8DA4"
                    size={24}
                    onPress={() =>
                      navigation.navigate("AddMember", {
                        existingMembers: members,
                        onSelect: (newMembers: Member[]) => {
                          setMembers(newMembers);
                        },
                      })
                    }
                  />
                </View>

                <FlatList
                  data={members}
                  keyExtractor={(item) => item._id}
                  style={styles.memberListScroll}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={<EmptyMemberComponent />}
                  renderItem={({ item: member }) => (
                    <View style={styles.memberContainer}>
                      <List.Item
                        title={member.fullName}
                        description={member.email}
                        titleStyle={styles.memberTitle}
                        descriptionStyle={styles.memberDescription}
                        left={() => <Avatar.Image size={48} source={{ uri: member.picture }} />}
                      />
                    </View>
                  )}
                />
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
    backgroundColor: '#FFFFFF',
  },
  appbarHeader: {
    backgroundColor: '#FEF0F3',
  },
  appbarTitle: {
    color: '#333',
    fontFamily: 'Montserrat-SemiBold',
    fontSize: responsiveFont(16),
    fontWeight: '700',
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveHeight(12),
  },
  sectionTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: responsiveFont(13),
    color: '#831843',
    marginLeft: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    fontFamily: 'Montserrat-Regular',
  },
  textArea: {
    textAlignVertical: 'top',
    height: responsiveHeight(150),
  },
  textInputOutline: {
    borderRadius: 12,
    borderColor: '#F9E2E7',
  },
  memberContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: responsiveWidth(10),
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F9E2E7',
    marginBottom: responsiveHeight(10),
  },
  memberTitle: {
    fontFamily: 'Montserrat-SemiBold',
    fontSize: responsiveFont(13),
    color: '#333333',
  },
  memberDescription: {
    fontFamily: 'Montserrat-Regular',
    fontSize: responsiveFont(10),
    color: '#6B7280',
  },
  memberListScroll: {
    maxHeight: responsiveHeight(300),
  },
  emptyMemberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: responsiveHeight(32),
    borderRadius: 12,
    marginVertical: responsiveHeight(45),
  },
  emptyMemberText: {
    marginTop: 4,
    color: '#B0B0B0',
    fontSize: responsiveFont(13),
    fontFamily: 'Montserrat-SemiBold',
  },
});