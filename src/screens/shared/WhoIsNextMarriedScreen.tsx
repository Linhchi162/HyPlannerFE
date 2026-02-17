import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Text,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
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
import { pinkHeaderStyles } from "../../styles/pinkHeader";
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
    <View style={styles.appbarSide}>
      <TouchableOpacity onPress={onBack} style={styles.appbarBack}>
        <Entypo name="chevron-left" size={24} color="#ffffff" />
      </TouchableOpacity>
    </View>

    <View style={styles.appbarTitleContainer}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.appbarTitle, pinkHeaderStyles.title]}
      >
        Ai là người tiếp theo sẽ kết hôn
      </Text>
    </View>

    <View style={styles.appbarSide} />
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
  const [hasStarted, setHasStarted] = useState(false);
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

  const getMemberId = (m: any, index?: number) => {
    if (m?._id) return m._id;
    if (m?.id) return m.id;
    if (m?.email) return `email:${m.email}`;
    if (m?.fullName) return `name:${m.fullName}`;
    if (m?.name) return `name:${m.name}`;
    if (typeof index === "number") return `index:${index}`;
    return "unknown";
  };

  // (spinWheel, shuffleMembers, resetWheel, removeMember, getSlicePath không đổi)
  const spinWheel = () => {
    setHasStarted(true);
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
    setHasStarted(true);
    setMembers((prev) => [...prev].sort(() => Math.random() - 0.5));
  };

  const resetWheel = () => {
    setHasStarted(true);
    setMembers(member.filter((m: any) => m._id !== creatorId));
    rotation.setValue(0);
    setWinner(null);
    setDialogVisible(false);
  };

  const removeMember = (idToRemove: string) => {
    if (spinning) return;
    setMembers((prev) =>
      prev.filter((m, index) => getMemberId(m, index) !== idToRemove)
    );
  };

  // ✅ MỚI: Hàm thêm thành viên
  const addMember = () => {
    if (newName.trim() === "" || spinning) return;
    setHasStarted(true);

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

  const visibleMembers = hasStarted ? members : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF" }}>
      <AppBar onBack={() => navigation.goBack()} />
      {isLoading ? (
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color="#ff5a7a" />
          <Text style={{ marginTop: 12, fontSize: responsiveFont(13) }}>
            Đang tải thông tin
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.container,
            {
              paddingBottom:
                Platform.OS === "android" ? 40 + insets.bottom : 40,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Vòng quay hoặc Thông báo Chúc mừng */}
          {visibleMembers && visibleMembers.length > 0 ? (
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
                    {visibleMembers.map((m, i) => (
                      <Path
                        key={`path-${i}-${getMemberId(m, i)}`}
                        d={getSlicePath(i)}
                        fill={colors[i % colors.length]}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                    {visibleMembers.map((m, i) => {
                      const sliceAngleDeg = 360 / visibleMembers.length;
                      const angleRad =
                        ((i + 0.5) * 2 * Math.PI) / visibleMembers.length;
                      const angleDeg = (angleRad * 180) / Math.PI;
                      const textX = radius * 0.6 * Math.cos(angleRad);
                      const textY = radius * 0.6 * Math.sin(angleRad);
                      const displayName = m.fullName || m.name || "";

                      // Xoay text để luôn đọc được từ ngoài vào trong
                      const rotation = angleDeg + 90;

                      return (
                        <SvgText
                          key={`text-${i}-${getMemberId(m, i)}`}
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
              outlineColor="#ff5a7a"
              activeOutlineColor="#ff5a7a"
              textColor="#000000"
              theme={{
                colors: {
                  background: "#ffffff",
                  text: "#000000",
                  onSurface: "#000000",
                },
              }}
              disabled={spinning}
            />
            <Button
              onPress={addMember}
              mode="text"
              style={styles.addButton}
              disabled={spinning || newName.trim() === ""}
              icon="plus"
              textColor="#ff5a7a"
              labelStyle={styles.addButtonLabel}
              theme={{
                colors: {
                  onSurfaceDisabled: "#9ca3af",
                },
              }}
            >
              Thêm
            </Button>
          </View>

          {/* Danh sách thành viên có thể xóa - dùng map thay FlatList để tránh lỗi nested VirtualizedList trong ScrollView */}
          {visibleMembers && visibleMembers.length > 0 && (
            <View style={styles.memberListContainer}>
              <Text style={styles.listTitle}>Thành viên đang tham gia:</Text>
              <View style={styles.list}>
                {visibleMembers.map((item, index) => (
                  <View
                    key={getMemberId(item, index)}
                    style={styles.memberItem}
                  >
                    <View
                      style={[
                        styles.memberColorChip,
                        { backgroundColor: colors[index % colors.length] },
                      ]}
                    />
                    <Text style={styles.memberName}>
                      {item.fullName || item.name || ""}
                    </Text>
                    <TouchableOpacity
                      onPress={() => removeMember(getMemberId(item, index))}
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
                ))}
              </View>
            </View>
          )}

          {/* Nút điều khiển */}
          <View style={styles.buttons}>
            <View style={styles.primaryButtonRow}>
              <Button
                mode="contained"
                onPress={spinWheel}
                disabled={spinning || !members || members.length === 0}
                style={styles.spinButton}
                textColor="#ffffff"
                theme={{
                  colors: {
                    primary: "#ff5a7a",
                    onPrimary: "#ffffff",
                    surfaceDisabled: "#ffd1da",
                    onSurfaceDisabled: "#ffffff",
                  },
                }}
              >
                {spinning ? "Đang quay..." : "Quay"}
              </Button>
            </View>

            <View style={styles.secondaryButtonsRow}>
              <Button
                mode="outlined"
                onPress={shuffleMembers}
                style={styles.shuffleButton}
                disabled={spinning || !members || members.length === 0}
                labelStyle={[styles.outlinedButtonLabel, { color: "#ff5a7a" }]}
                textColor="#ff5a7a"
                theme={{
                  colors: {
                    outline: "#ff5a7a",
                    onSurface: "#ff5a7a",
                    onSurfaceDisabled: "#9ca3af",
                  },
                }}
              >
                Xáo trộn
              </Button>
              <Button
                mode="outlined"
                onPress={resetWheel}
                style={styles.resetButton}
                labelStyle={[styles.outlinedButtonLabel, { color: "rgb(35, 141, 233)" }]}
                textColor="rgb(35, 141, 233)"
                theme={{
                  colors: {
                    outline: "rgb(35, 141, 233)",
                    onSurface: "rgb(35, 141, 233)",
                  },
                }}
              >
                Làm mới
              </Button>
            </View>
          </View>
        </ScrollView>
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
            <Text style={styles.dialogText}>
              {winner?.fullName || winner?.name || ""}
            </Text>
            <Text style={styles.dialogSubText}>
              <Heart color="#ff5a7a" /> là người tiếp theo sẽ kết hôn!{" "}
              <Heart color="#ff5a7a" />
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
              textColor="#ffffff"
              theme={{
                colors: {
                  primary: "#ff5a7a",
                  onPrimary: "#ffffff",
                },
              }}
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
    backgroundColor: "#ff5a7a",
    elevation: 0,
    shadowOpacity: 0,
    minHeight: responsiveHeight(30),
    flexDirection: "row",
    alignItems: "center",
  },
  appbarSide: {
    width: responsiveWidth(48),
    alignItems: "flex-start",
    justifyContent: "center",
  },
  appbarBack: {
    padding: responsiveWidth(8),
  },
  appbarTitleContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  appbarTitle: {
    color: "#ffffff",
    fontFamily: "MavenPro",
    fontSize: responsiveFont(16),
    lineHeight: responsiveFont(24),
    textAlign: "center",
    fontWeight: "700",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
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
    backgroundColor: "#ffffff",
  },
  addButton: {
    backgroundColor: "transparent",
    justifyContent: "center",
    elevation: 0,
  },
  addButtonLabel: {
    fontFamily: "MavenPro",
    fontSize: responsiveFont(14),
    fontWeight: "700",
  },
  outlinedButtonLabel: {
    fontFamily: "MavenPro",
    fontWeight: "700",
  },

  // ... (button styles)
  buttons: {
    width: "90%",
    marginTop: responsiveHeight(30),
  },
  primaryButtonRow: {
    width: "100%",
    marginBottom: responsiveHeight(10),
  },
  secondaryButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: responsiveWidth(10),
    alignItems: "center",
    width: "100%",
  },
  spinButton: {
    backgroundColor: "#ff5a7a",
    flex: 1,
  },
  shuffleButton: {
    borderColor: "#ff5a7a",
    flex: 1,
  },
  resetButton: {
    flex: 1,
    borderColor: "#0891b2",
  },
  // ... (congrats styles)
  congratsContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: responsiveWidth(15),
    marginHorizontal: responsiveWidth(20),
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(20),
    borderWidth: 2,
    borderColor: "#ff5a7a",
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

  // ✅ CHỈNH SỬA: maxHeight để nút Quay luôn hiển thị trên màn hình
  memberListContainer: {
    width: "90%",
    marginTop: responsiveHeight(20),
    maxHeight: responsiveHeight(180),
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
    color: "#ff5a7a",
    fontWeight: "700",
  },
  dialogContent: {
    alignItems: "center",
    paddingBottom: responsiveHeight(20),
  },
  dialogIcon: {
    backgroundColor: "#ff5a7a",
    marginBottom: responsiveWidth(16),
  },
  dialogText: {
    fontSize: responsiveFont(20),
    fontFamily: "Montserrat-SemiBold",
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "600",
  },
  dialogSubText: {
    fontSize: responsiveFont(16),
    color: "#ffffff",
    textAlign: "center",
    marginTop: responsiveHeight(-6),
  },
  dialogActions: {
    justifyContent: "center",
    paddingBottom: responsiveHeight(20),
    paddingHorizontal: responsiveWidth(16),
  },
  dialogButton: {
    backgroundColor: "#ff5a7a",
    width: "100%",
  },
});
