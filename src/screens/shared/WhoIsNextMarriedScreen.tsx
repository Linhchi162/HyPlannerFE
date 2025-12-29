import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Text,
  FlatList,
  Dimensions,
  Keyboard,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Button,
  Dialog,
  Portal,
  TextInput,
} from "react-native-paper";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { Entypo } from "@expo/vector-icons";
import {
  responsiveFont,
  responsiveHeight,
  responsiveWidth,
} from "../../../assets/styles/utils/responsive";
import {
  useNavigation,
  useRoute,
  NavigationProp,
  RouteProp,
} from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import ConfettiCannon from "react-native-confetti-cannon";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { selectCurrentUser } from "../../store/authSlice";
import { getWeddingEvent } from "../../service/weddingEventService";
import { Heart } from "lucide-react-native";

// (AppBar không đổi)
interface AppBarWINMProps {
  onBack: () => void;
}
const AppBar = ({ onBack }: AppBarWINMProps) => (
  <Appbar.Header style={styles.appbarHeader}>
    <TouchableOpacity onPress={onBack} style={styles.appbarBack}>
      <Entypo name="chevron-left" size={24} color="#000000" />
    </TouchableOpacity>
    <Appbar.Content
      title="Ai là người tiếp theo sẽ kết hôn"
      titleStyle={styles.appbarTitle}
    />
  </Appbar.Header>
);

export default function WhoIsNextMarriedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "WhoIsNextMarried">>();
  const { creatorId } = route.params;
  const user = useSelector(selectCurrentUser);
  const dispatch = useDispatch<AppDispatch>();

  const { weddingEvent, isLoading, error } = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent
  );

  // ❌ REMOVED: Duplicate API call - data now fetched centrally in App.tsx via useAppInitialization
  // useEffect(() => {
  //   const fetchWeddingInfo = async () => {
  //     const userId = user?.id || user?._id;
  //     if (userId) {
  //       try {
  //         await getWeddingEvent(userId, dispatch);
  //       } catch (err) {
  //         console.error("Error fetching wedding info:", err);
  //       }
  //     }
  //   };
  //   fetchWeddingInfo();
  // }, [dispatch, user]);

  const member = weddingEvent?.member || [];

  const [members, setMembers] = useState<any[]>(
    member.filter((m: any) => m._id !== creatorId)
  );
  const [winner, setWinner] = useState<any>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [spinning, setSpinning] = useState(false);

  // ✅ MỚI: State cho tên thành viên mới
  const [newName, setNewName] = useState("");

  // Sync members when weddingEvent changes
  useEffect(() => {
    if (weddingEvent?.member) {
      setMembers(weddingEvent.member.filter((m: any) => m._id !== creatorId));
    }
  }, [weddingEvent, creatorId]);

  const rotation = useRef(new Animated.Value(0)).current;
  const pointerAnim = useRef(new Animated.Value(0)).current;

  const radius = 150;
  const colors = [
    "#F7C5CC",
    "#FFD6A5",
    "#FDFFB6",
    "#CAFFBF",
    "#A0C4FF",
    "#BDB2FF",
  ];

  const { width } = Dimensions.get("window");

  // (spinWheel, shuffleMembers, resetWheel, removeMember, getSlicePath không đổi)
  const spinWheel = () => {
    if (spinning || !members || members.length === 0) return;
    setSpinning(true);
    const randomIndex = Math.floor(Math.random() * members.length);
    const sliceAngle = 360 / members.length;
    const angleToWinnerMiddle = (randomIndex + 0.5) * sliceAngle;
    const randomRotation = 360 * 10 + angleToWinnerMiddle - 270;
    Animated.timing(rotation, {
      toValue: randomRotation,
      duration: 4000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start(() => {
      Animated.sequence([
        Animated.timing(pointerAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pointerAnim, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pointerAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
      setWinner(members[randomIndex]);
      setDialogVisible(true);
      rotation.setValue(randomRotation % 360);
      setSpinning(false);
    });
  };

  const shuffleMembers = () => {
    setMembers((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const resetWheel = () => {
    setMembers(member.filter((m: any) => m._id !== creatorId));
    rotation.setValue(0);
    setWinner(null);
    setDialogVisible(false);
  };

  const removeMember = (idToRemove: string) => {
    if (spinning) return;
    setMembers((prev) => prev.filter((m) => m._id !== idToRemove));
  };

  // ✅ MỚI: Hàm thêm thành viên
  const addMember = () => {
    if (newName.trim() === "" || spinning) return;

    const newMember = {
      _id: Date.now().toString(), // Tạo ID tạm thời duy nhất
      fullName: newName.trim(),
      email: "",
    };
    setMembers((prev) => [...prev, newMember]);
    setNewName(""); // Xóa ô input
    Keyboard.dismiss(); // Ẩn bàn phím
  };

  const getSlicePath = (index: number) => {
    if (!members || members.length === 0) return "";
    if (members.length === 1) {
      return `M 0 0 M ${radius} 0 A ${radius} ${radius} 0 1 1 ${-radius} 0 A ${radius} ${radius} 0 1 1 ${radius} 0 Z`;
    }
    const startAngle = (index * 2 * Math.PI) / members.length;
    const endAngle = ((index + 1) * 2 * Math.PI) / members.length;
    const x1 = radius * Math.cos(startAngle);
    const y1 = radius * Math.sin(startAngle);
    const x2 = radius * Math.cos(endAngle);
    const y2 = radius * Math.sin(endAngle);
    const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M0,0 L${x1},${y1} A${radius},${radius} 0 ${largeArcFlag} 1 ${x2},${y2} Z`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <AppBar onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color="#F06292" />
          <Text style={{ marginTop: 12, fontSize: responsiveFont(13) }}>
            Đang tải thông tin
          </Text>
        </View>
      ) : (
        <View
          style={[
            styles.container,
            {
              paddingBottom:
                Platform.OS === "android" ? 40 + insets.bottom : 40,
            },
          ]}
        >
          {/* Vòng quay hoặc Thông báo Chúc mừng */}
          {members && members.length > 0 ? (
            <View style={styles.wheelContainer}>
              {/* Bánh xe */}
              <Animated.View
                style={{
                  transform: [
                    {
                      rotate: rotation.interpolate({
                        inputRange: [0, 360],
                        outputRange: ["0deg", "360deg"],
                      }),
                    },
                  ],
                }}
              >
                <Svg
                  width={radius * 2}
                  height={radius * 2}
                  viewBox={`-${radius} -${radius} ${radius * 2} ${radius * 2}`}
                >
                  <G>
                    {members.map((m, i) => (
                      <Path
                        key={`path-${i}-${m._id}`}
                        d={getSlicePath(i)}
                        fill={colors[i % colors.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                    {members.map((m, i) => {
                      const sliceAngleDeg = 360 / members.length;
                      const angleRad =
                        ((i + 0.5) * 2 * Math.PI) / members.length;
                      const angleDeg = (angleRad * 180) / Math.PI;
                      const textX = radius * 0.6 * Math.cos(angleRad);
                      const textY = radius * 0.6 * Math.sin(angleRad);
                      const displayName = m.fullName || m.name || "Unknown";

                      // Xoay text để luôn đọc được từ ngoài vào trong
                      const rotation = angleDeg + 90;

                      return (
                        <SvgText
                          key={`text-${i}-${m._id}`}
                          x={textX}
                          y={textY}
                          fontSize={responsiveFont(12)}
                          fontWeight="bold"
                          fill="#333"
                          textAnchor="middle"
                          alignmentBaseline="middle"
                          rotation={rotation}
                          origin={`${textX}, ${textY}`}
                        >
                          {displayName.length > 10
                            ? displayName.slice(0, 10) + "…"
                            : displayName}
                        </SvgText>
                      );
                    })}
                  </G>
                </Svg>
              </Animated.View>

              {/* Kim chỉ */}
              <Animated.View
                style={[
                  styles.pointer,
                  {
                    transform: [
                      {
                        rotate: pointerAnim.interpolate({
                          inputRange: [-1, 1],
                          outputRange: ["-15deg", "15deg"],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Entypo name="triangle-down" size={32} color="red" />
              </Animated.View>
            </View>
          ) : (
            <View style={[styles.congratsContainer, { minHeight: radius * 2 }]}>
              <Text style={styles.congratsEmoji}>🎉</Text>
              <Text style={styles.congratsText}>
                Chúc mừng các thành viên trong nhóm
              </Text>
              <Text style={styles.congratsText}>
                sẽ là người tiếp theo cưới!
              </Text>
            </View>
          )}

          {/* ✅ MỚI: Khu vực thêm thành viên */}
          <View style={styles.addMemberContainer}>
            <TextInput
              label="Thêm tên thành viên"
              value={newName}
              onChangeText={setNewName}
              style={styles.textInput}
              mode="outlined"
              dense
              outlineColor="#F06292"
              activeOutlineColor="#F06292"
              disabled={spinning}
            />
            <Button
              onPress={addMember}
              mode="contained"
              style={styles.addButton}
              disabled={spinning || newName.trim() === ""}
              icon="plus"
            >
              Thêm
            </Button>
          </View>

          {/* Danh sách thành viên có thể xóa */}
          {members && members.length > 0 && (
            <View style={styles.memberListContainer}>
              <Text style={styles.listTitle}>Thành viên đang tham gia:</Text>
              <FlatList
                data={members}
                keyExtractor={(item) => item._id}
                renderItem={({ item, index }) => (
                  <View style={styles.memberItem}>
                    <View
                      style={[
                        styles.memberColorChip,
                        { backgroundColor: colors[index % colors.length] },
                      ]}
                    />
                    <Text style={styles.memberName}>
                      {item.fullName || item.name || "Unknown"}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeMember(item._id)}
                      style={styles.deleteButton}
                      disabled={spinning}
                    >
                      <Entypo
                        name="circle-with-cross"
                        size={20}
                        color={spinning ? "#AAA" : "#E53935"}
                      />
                    </TouchableOpacity>
                  </View>
                )}
                style={styles.list}
              />
            </View>
          )}

          {/* Nút điều khiển */}
          <View style={styles.buttons}>
            <Button
              mode="contained"
              onPress={spinWheel}
              disabled={spinning || !members || members.length === 0}
              style={styles.spinButton}
            >
              {spinning ? "Đang quay..." : "Quay"}
            </Button>
            <Button
              mode="outlined"
              onPress={shuffleMembers}
              style={styles.shuffleButton}
              disabled={spinning || !members || members.length === 0}
            >
              Xáo trộn
            </Button>
            <Button
              mode="outlined"
              onPress={resetWheel}
              style={styles.resetButton}
            >
              Làm mới
            </Button>
          </View>
        </View>
      )}

      {/* (Dialog kết quả và Confetti không đổi) */}
      <Portal>
        <Dialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          style={styles.dialogStyle}
        >
          <Dialog.Title style={styles.dialogTitle}>
            🎉 Chúc mừng! 🎉
          </Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Avatar.Icon
              icon="ring"
              size={64}
              color="#fff"
              style={styles.dialogIcon}
            />
            <Text style={styles.dialogText}>{winner?.fullName}</Text>
            <Text style={styles.dialogSubText}>
              <Heart color="#F06292" /> là người tiếp theo sẽ kết hôn!{" "}
              <Heart color="#F06292" />
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={() => {
                setDialogVisible(false);
                setMembers((prev) => prev.filter((m) => m._id !== winner._id));
              }}
              mode="contained"
              style={styles.dialogButton}
            >
              Tuyệt vời!
            </Button>
          </Dialog.Actions>
        </Dialog>

        {dialogVisible && (
          <ConfettiCannon
            count={200}
            origin={{ x: width / 2, y: -20 }}
            autoStart={true}
            fadeOut={true}
            explosionSpeed={300}
            fallSpeed={3000}
          />
        )}
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (appbar styles)
  appbarHeader: {
    backgroundColor: "#FEF0F3",
    elevation: 0,
    shadowOpacity: 0,
    justifyContent: "center",
    minHeight: responsiveHeight(30),
  },
  appbarBack: {
    position: "absolute",
    left: 0,
    padding: responsiveWidth(8),
    zIndex: 1,
  },
  appbarTitle: {
    color: "#333",
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(16),
    lineHeight: responsiveFont(24),
    textAlign: "center",
    alignSelf: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: responsiveHeight(20),
    paddingBottom: responsiveHeight(40),
  },
  wheelContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  pointer: {
    position: "absolute",
    top: responsiveHeight(-16),
    alignSelf: "center",
    zIndex: 10,
  },

  // ✅ MỚI: Style cho khu vực thêm thành viên
  addMemberContainer: {
    flexDirection: "row",
    width: "90%",
    marginTop: responsiveHeight(20),
    gap: responsiveWidth(10),
    alignItems: "center",
  },
  textInput: {
    flex: 1,
  },
  addButton: {
    backgroundColor: "#F06292",
    justifyContent: "center",
  },

  // ... (button styles)
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: responsiveWidth(10),
    alignItems: "center",
    width: "90%",
    marginTop: responsiveHeight(30),
  },
  spinButton: {
    backgroundColor: "#F06292",
    flex: 1,
  },
  shuffleButton: {
    borderColor: "#F06292",
    flex: 1,
  },
  resetButton: {
    flex: 1,
  },
  // ... (congrats styles)
  congratsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(15),
    marginHorizontal: responsiveWidth(20),
    backgroundColor: "#FEF0F3",
    borderRadius: responsiveWidth(20),
    borderWidth: 2,
    borderColor: "#F06292",
  },
  congratsEmoji: {
    fontSize: responsiveFont(48),
    marginBottom: responsiveHeight(10),
  },
  congratsText: {
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-SemiBold",
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },

  // ✅ CHỈNH SỬA: Thay đổi marginTop
  memberListContainer: {
    width: "90%",
    marginTop: responsiveHeight(20), // Giảm margin
    flexShrink: 1,
    flex: 1,
  },
  // ... (list styles)
  listTitle: {
    fontSize: responsiveFont(14),
    fontFamily: "Montserrat-SemiBold",
    color: "#555",
    marginBottom: responsiveHeight(5),
    textAlign: "center",
  },
  list: {
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: responsiveWidth(8),
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(12),
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  memberColorChip: {
    width: responsiveWidth(16),
    height: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    marginRight: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#DDD",
  },
  memberName: {
    flex: 1,
    fontSize: responsiveFont(14),
    color: "#333",
  },
  deleteButton: {
    paddingLeft: responsiveWidth(10),
  },

  // ... (dialog styles)
  dialogStyle: {
    borderRadius: responsiveWidth(20),
  },
  dialogTitle: {
    textAlign: "center",
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(22),
    color: "#F06292",
    fontWeight: "700",
  },
  dialogContent: {
    alignItems: "center",
    paddingBottom: responsiveHeight(20),
  },
  dialogIcon: {
    backgroundColor: "#F06292",
    marginBottom: responsiveWidth(16),
  },
  dialogText: {
    fontSize: responsiveFont(20),
    fontFamily: "Montserrat-SemiBold",
    color: "#333",
    textAlign: "center",
    fontWeight: "600",
  },
  dialogSubText: {
    fontSize: responsiveFont(16),
    color: "#555",
    textAlign: "center",
    marginTop: responsiveHeight(4),
  },
  dialogActions: {
    justifyContent: "center",
    paddingBottom: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(16),
  },
  dialogButton: {
    backgroundColor: "#F06292",
    width: "100%",
  },
});
