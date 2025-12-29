import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  Share,
  Platform,
  ToastAndroid,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getAccountLimits, getUpgradeMessage } from "../../utils/accountLimits";
import { selectCurrentUser } from "../../store/authSlice";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Contacts from "expo-contacts";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import {
  ChevronLeft,
  Plus,
  Search,
  Filter,
  UserPlus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Gift,
  Table,
  Download,
  Upload,
  Bell,
  Mail,
  Calendar,
  CheckSquare,
  Square,
} from "lucide-react-native";
import { AppDispatch, RootState } from "../../store";
import {
  fetchGuestsByWeddingEvent,
  createNewGuest,
  updateExistingGuest,
  deleteExistingGuest,
  updateGuestAttendance,
  fetchTableSuggestions,
  importGuestList,
} from "../../store/guestSlice";
import { RootStackParamList } from "../../navigation/types";
import {
  responsiveWidth,
  responsiveHeight,
  responsiveFont,
} from "../../../assets/styles/utils/responsive";
import { MixpanelService } from "../../service/mixpanelService";
import * as guestService from "../../service/guestService";

type GuestManagementScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "GuestManagementScreen"
>;

const GuestManagementScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<GuestManagementScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();

  const { guests, stats, tableSuggestions, isLoading } = useSelector(
    (state: RootState) =>
      state.guests || {
        guests: [],
        stats: null,
        tableSuggestions: null,
        isLoading: false,
      }
  );
  const weddingEvent = useSelector(
    (state: RootState) => state.weddingEvent?.getWeddingEvent?.weddingEvent
  );

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroup, setFilterGroup] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortByName, setSortByName] = useState<"asc" | "desc" | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Thank you email states
  const [sendingThankYou, setSendingThankYou] = useState(false);

  // Table configuration states
  const [guestsPerTable, setGuestsPerTable] = useState(10);

  // Form states for Add
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    relationship: "friend" as "family" | "friend" | "colleague" | "other",
    group: "groom" as "groom" | "bride" | "both",
    category: "",
    numberOfCompanions: 0,
    dietaryRestrictions: "",
    notes: "",
  });

  // Form states for Edit
  const [editFormData, setEditFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    address: "",
    relationship: "friend" as "family" | "friend" | "colleague" | "other",
    group: "groom" as "groom" | "bride" | "both",
    numberOfCompanions: 0,
    notes: "",
    giftType: "none" as "money" | "item" | "both" | "none",
    giftAmount: "",
    giftDescription: "",
    giftReceivedDate: new Date().toISOString(),
    giftReceivedMethod: "not_received" as
      | "at_event"
      | "bank_transfer"
      | "before_event"
      | "after_event"
      | "not_received",
    giftReturnedGift: false,
  });
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  useEffect(() => {
    MixpanelService.track("Viewed Guest Management");

    if (weddingEvent?._id) {
      loadGuests();
      loadTableSuggestions();
    }
  }, [weddingEvent?._id]);

  useEffect(() => {
    if (weddingEvent?._id) {
      loadGuests();
    }
  }, [filterGroup, filterStatus]);

  const loadGuests = () => {
    if (weddingEvent?._id) {
      const filters: any = {};
      if (filterGroup) filters.group = filterGroup;
      if (filterStatus) filters.attendanceStatus = filterStatus;

      dispatch(
        fetchGuestsByWeddingEvent({
          weddingEventId: weddingEvent._id,
          filters,
        })
      );
    }
  };

  const loadTableSuggestions = () => {
    if (weddingEvent?._id) {
      dispatch(
        fetchTableSuggestions({
          weddingEventId: weddingEvent._id,
          guestsPerTable: guestsPerTable,
        })
      );
    }
  };

  const handleGuestsPerTableChange = (value: number) => {
    if (value >= 6 && value <= 15) {
      setGuestsPerTable(value);
    }
  };

  // Reload table suggestions when guestsPerTable changes
  useEffect(() => {
    if (weddingEvent?._id) {
      loadTableSuggestions();
    }
  }, [guestsPerTable]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (weddingEvent?._id) {
        await Promise.all([loadGuests(), loadTableSuggestions()]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddGuest = () => {
    setShowAddModal(true);
  };

  const handleCreateGuest = async () => {
    if (!formData.name.trim()) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Vui lòng nhập tên khách mời", ToastAndroid.SHORT);
      } else {
        Alert.alert("Lỗi", "Vui lòng nhập tên khách mời");
      }
      return;
    }

    if (!weddingEvent?._id) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Không tìm thấy sự kiện cưới", ToastAndroid.SHORT);
      } else {
        Alert.alert("Lỗi", "Không tìm thấy sự kiện cưới");
      }
      return;
    }

    try {
      await dispatch(
        createNewGuest({
          weddingEventId: weddingEvent._id,
          ...formData,
        })
      ).unwrap();

      // Reset form
      setFormData({
        name: "",
        phoneNumber: "",
        email: "",
        address: "",
        relationship: "friend",
        group: "groom",
        category: "",
        numberOfCompanions: 0,
        dietaryRestrictions: "",
        notes: "",
      });

      setShowAddModal(false);
      Alert.alert("Thành công", "Đã thêm khách mời!");
      loadGuests();
      loadTableSuggestions();
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Không thể thêm khách mời");
    }
  };

  const handleGuestPress = (guest: any) => {
    handleEditGuest(guest);
    setShowEditModal(true);
  };

  const handleEditGuest = (guest: any) => {
    setSelectedGuest(guest);
    setEditFormData({
      name: guest.name || "",
      phoneNumber: guest.phoneNumber || "",
      email: guest.email || "",
      address: guest.address || "",
      relationship: guest.relationship || "friend",
      group: guest.group || "groom",
      numberOfCompanions: guest.numberOfCompanions || 0,
      notes: guest.notes || "",
      giftType: guest.gift?.type || "none",
      giftAmount: guest.gift?.amount?.toString() || "",
      giftDescription: guest.gift?.description || "",
      giftReceivedDate: guest.gift?.receivedDate || new Date().toISOString(),
      giftReceivedMethod: guest.gift?.receivedMethod || "not_received",
      giftReturnedGift: guest.gift?.returnedGift || false,
    });
    setShowMenuModal(false);
    setShowEditModal(true);
  };

  const handleUpdateGuest = async () => {
    if (!editFormData.name.trim()) {
      if (Platform.OS === "android") {
        ToastAndroid.show("Vui lòng nhập tên khách mời", ToastAndroid.SHORT);
      } else {
        Alert.alert("Lỗi", "Vui lòng nhập tên khách mời");
      }
      return;
    }

    if (!selectedGuest?._id) {
      Alert.alert("Lỗi", "Không tìm thấy khách mời");
      return;
    }

    try {
      await dispatch(
        updateExistingGuest({
          guestId: selectedGuest._id,
          data: {
            name: editFormData.name.trim(),
            phoneNumber: editFormData.phoneNumber.trim(),
            email: editFormData.email.trim(),
            address: editFormData.address.trim(),
            relationship: editFormData.relationship,
            group: editFormData.group,
            numberOfCompanions: editFormData.numberOfCompanions,
            notes: editFormData.notes.trim(),
            totalGuests: 1 + editFormData.numberOfCompanions,
            gift: {
              type: editFormData.giftType,
              amount: editFormData.giftAmount
                ? parseFloat(editFormData.giftAmount)
                : undefined,
              description: editFormData.giftDescription,
              receivedDate: editFormData.giftReceivedDate,
              receivedMethod: editFormData.giftReceivedMethod,
              returnedGift: editFormData.giftReturnedGift,
            },
          },
        })
      ).unwrap();

      setShowEditModal(false);
      Alert.alert("Thành công", "Đã cập nhật thông tin khách mời!");
      loadGuests();
      loadTableSuggestions();
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Không thể cập nhật khách mời");
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);

      // Tạo dữ liệu CSV
      const csvHeader =
        "STT,Tên khách mời,Số điện thoại,Email,Địa chỉ,Mối quan hệ,Nhóm,Số người đi cùng,Trạng thái,Loại quà,Giá trị quà,Ghi chú quà,Hạn chế ăn uống,Ghi chú\n";

      const csvRows = guests.map((guest: any, index: number) => {
        const row = [
          index + 1,
          `\"${guest.name || ""}\"`,
          `\"${guest.phoneNumber || ""}\"`,
          `\"${guest.email || ""}\"`,
          `\"${guest.address || ""}\"`,
          `\"${guest.relationship || ""}\"`,
          `\"${guest.group === "groom" ? "Nhà trai" : "Nhà gái"}\"`,
          guest.numberOfCompanions || 0,
          `\"${
            guest.attendanceStatus === "confirmed"
              ? "Xác nhận"
              : guest.attendanceStatus === "declined"
              ? "Từ chối"
              : "Chờ"
          }\"`,
          `\"${
            guest.gift?.type === "money"
              ? "Tiền mặt"
              : guest.gift?.type === "item"
              ? "Quà tặng"
              : guest.gift?.type === "both"
              ? "Cả hai"
              : "Chưa có"
          }\"`,
          guest.gift?.amount || 0,
          `\"${guest.gift?.description || ""}\"`,
          `\"${guest.dietaryRestrictions || ""}\"`,
          `\"${guest.notes || ""}\"`,
        ];
        return row.join(",");
      });

      const csvContent = csvHeader + csvRows.join("\n");

      // Tạo tên file với timestamp
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const fileName = `DanhSachKhachMoi_${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      // Ghi file với BOM cho Excel UTF-8
      await FileSystem.writeAsStringAsync(fileUri, "\ufeff" + csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Chia sẻ file
      if (Platform.OS === "android" || Platform.OS === "ios") {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "text/csv",
            dialogTitle: "Xuất danh sách khách mời",
            UTI: "public.comma-separated-values-text",
          });
        } else {
          Alert.alert("Thành công", `File đã được lưu tại: ${fileUri}`, [
            {
              text: "OK",
              onPress: () => {
                Share.share({
                  message: `Danh sách khách mời đã được xuất`,
                  url: fileUri,
                });
              },
            },
          ]);
        }
      } else {
        Alert.alert("Thành công", `File đã được lưu tại: ${fileUri}`);
      }

      MixpanelService.track("Export Guest List", {
        total_guests: guests.length,
        file_name: fileName,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể xuất file: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportExcel = async () => {
    try {
      setIsImporting(true);

      // Chọn file CSV/Excel
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "text/csv",
          "text/comma-separated-values",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsImporting(false);
        return;
      }

      const file = result.assets[0];

      // Đọc file
      const fileContent = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Parse CSV
      const lines = fileContent.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        Alert.alert("Lỗi", "File không có dữ liệu");
        setIsImporting(false);
        return;
      }

      // Bỏ qua header và BOM nếu có
      const dataLines = lines.slice(1);

      const parsedGuests = dataLines
        .map((line) => {
          // Remove BOM if present
          const cleanLine = line.replace(/^\uFEFF/, "");

          // Parse CSV row (handle quoted values)
          const values: string[] = [];
          let currentValue = "";
          let inQuotes = false;

          for (let i = 0; i < cleanLine.length; i++) {
            const char = cleanLine[i];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === "," && !inQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          // Map CSV columns to guest object
          return {
            name: values[1] || "",
            phoneNumber: values[2] || "",
            email: values[3] || "",
            address: values[4] || "",
            relationship: values[5] || "friend",
            group: values[6] === "Nhà gái" ? "bride" : "groom",
            numberOfCompanions: parseInt(values[7]) || 0,
            attendanceStatus:
              values[8] === "Xác nhận"
                ? "confirmed"
                : values[8] === "Từ chối"
                ? "declined"
                : "pending",
            dietaryRestrictions: values[12] || "",
            notes: values[13] || "",
          };
        })
        .filter((guest) => guest.name); // Chỉ lấy những dòng có tên

      if (parsedGuests.length === 0) {
        Alert.alert("Lỗi", "Không tìm thấy dữ liệu hợp lệ trong file");
        setIsImporting(false);
        return;
      }

      // Hiển thị preview
      setImportData(parsedGuests);
      setShowImportPreview(true);
      setIsImporting(false);

      MixpanelService.track("Import Guest List - File Selected", {
        file_name: file.name,
        guest_count: parsedGuests.length,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể đọc file: " + error.message);
      setIsImporting(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!weddingEvent?._id) {
      Alert.alert("Lỗi", "Không tìm thấy sự kiện cưới");
      return;
    }

    try {
      setIsImporting(true);

      await dispatch(
        importGuestList({
          weddingEventId: weddingEvent._id,
          guests: importData,
        })
      ).unwrap();

      Alert.alert("Thành công", `Đã import ${importData.length} khách mời!`);
      setShowImportPreview(false);
      setImportData([]);
      loadGuests();
      loadTableSuggestions();

      MixpanelService.track("Import Guest List - Confirmed", {
        guest_count: importData.length,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", error || "Không thể import danh sách");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportFromContacts = async () => {
    try {
      // Request permissions
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Quyền truy cập",
          "Ứng dụng cần quyền truy cập danh bạ để import khách mời"
        );
        return;
      }

      setIsImporting(true);

      // Get contacts
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.Name,
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Emails,
        ],
      });

      if (data.length === 0) {
        Alert.alert("Thông báo", "Không có liên hệ nào trong danh bạ");
        setIsImporting(false);
        return;
      }

      // Convert contacts to guest format
      const guestsFromContacts = data
        .map((contact) => ({
          name: contact.name || "",
          phoneNumber: contact.phoneNumbers?.[0]?.number || "",
          email: contact.emails?.[0]?.email || "",
          group: "groom" as const,
          relationship: "friend" as const,
          numberOfCompanions: 0,
        }))
        .filter((guest) => guest.name);

      if (guestsFromContacts.length === 0) {
        Alert.alert("Thông báo", "Không có liên hệ hợp lệ");
        setIsImporting(false);
        return;
      }

      // Show preview
      setImportData(guestsFromContacts);
      setShowImportPreview(true);
      setIsImporting(false);

      MixpanelService.track("Import Guest List - From Contacts", {
        guest_count: guestsFromContacts.length,
      });
    } catch (error: any) {
      Alert.alert("Lỗi", "Không thể đọc danh bạ: " + error.message);
      setIsImporting(false);
    }
  };

  const handleSendThankYouEmails = () => {
    if (!weddingEvent?._id) {
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Không tìm thấy thông tin sự kiện cưới",
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert("Lỗi", "Không tìm thấy thông tin sự kiện cưới");
      }
      return;
    }

    if (!stats || stats.confirmed === 0) {
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Chưa có khách nào xác nhận tham dự",
          ToastAndroid.SHORT
        );
      } else {
        Alert.alert("Thông báo", "Chưa có khách nào xác nhận tham dự");
      }
      return;
    }

    Alert.alert(
      "Gửi email cảm ơn",
      `Bạn muốn gửi email cảm ơn tới ${stats.confirmed} khách đã tham dự?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Gửi",
          onPress: async () => {
            try {
              setSendingThankYou(true);

              const response = await guestService.sendThankYouEmails(
                weddingEvent._id,
                {} // Send empty object to ensure req.body is defined
              );

              Alert.alert(
                "Thành công",
                `Đã gửi email cảm ơn tới ${response.recipients} khách mời!`
              );

              MixpanelService.track("Send Thank You Emails", {
                recipients: response.recipients,
              });
            } catch (error: any) {
              Alert.alert("Lỗi", error.message || "Không thể gửi email");
            } finally {
              setSendingThankYou(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteGuest = (guestId: string) => {
    Alert.alert("Xóa khách mời", "Bạn có chắc chắn muốn xóa khách mời này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: () => {
          dispatch(deleteExistingGuest(guestId));
          setShowMenuModal(false);
        },
      },
    ]);
  };

  const handleUpdateAttendance = (guestId: string, status: string) => {
    dispatch(updateGuestAttendance({ guestId, status }));
    setShowMenuModal(false);
  };

  const filteredGuests = (guests || [])
    .filter((guest: any) => {
      const matchesSearch = guest.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Apply group filter
      const matchesGroup = filterGroup ? guest.group === filterGroup : true;

      // Apply status filter
      const matchesStatus = filterStatus
        ? guest.attendanceStatus === filterStatus
        : true;

      return matchesSearch && matchesGroup && matchesStatus;
    })
    .sort((a: any, b: any) => {
      if (sortByName === "asc") {
        return a.name.localeCompare(b.name, "vi");
      } else if (sortByName === "desc") {
        return b.name.localeCompare(a.name, "vi");
      }
      return 0; // Không sắp xếp nếu sortByName là null
    });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle size={16} color="#10b981" />;
      case "declined":
        return <XCircle size={16} color="#ef4444" />;
      case "pending":
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <Clock size={16} color="#9ca3af" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Xác nhận";
      case "declined":
        return "Từ chối";
      case "pending":
        return "Chờ phản hồi";
      case "no_response":
        return "Chưa phản hồi";
      default:
        return status;
    }
  };

  const getGroupText = (group: string) => {
    switch (group) {
      case "groom":
        return "Nhà trai";
      case "bride":
        return "Nhà gái";
      case "both":
        return "Chung";
      default:
        return group;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getRelationshipText = (relationship: string) => {
    switch (relationship) {
      case "family":
        return "Gia đình";
      case "friend":
        return "Bạn bè";
      case "colleague":
        return "Đồng nghiệp";
      case "other":
        return "Khác";
      default:
        return relationship;
    }
  };

  const renderGuestCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.guestCard}
      onPress={() => handleGuestPress(item)}
    >
      <View style={styles.guestCardHeader}>
        <View style={styles.guestInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.guestName}>{item.name}</Text>
            {item.confirmedViaInvitation && (
              <View style={styles.invitationBadge}>
                <Text style={styles.invitationBadgeText}>Thiệp mời</Text>
              </View>
            )}
          </View>
          <View style={styles.guestMeta}>
            <Text style={styles.groupBadge}>{getGroupText(item.group)}</Text>
            {item.relationship && (
              <Text style={styles.categoryText}>
                • {getRelationshipText(item.relationship)}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={() => {
            setSelectedGuest(item);
            setShowMenuModal(true);
          }}
        >
          <MoreVertical size={20} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      <View style={styles.guestCardBody}>
        <View style={styles.guestDetail}>
          {getStatusIcon(item.attendanceStatus)}
          <Text style={styles.guestDetailText}>
            {getStatusText(item.attendanceStatus)}
          </Text>
        </View>
        <View style={styles.guestDetail}>
          <Users size={14} color="#6b7280" />
          <Text style={styles.guestDetailText}>{item.totalGuests} người</Text>
        </View>
        {item.tableNumber && (
          <View style={styles.guestDetail}>
            <Table size={14} color="#6b7280" />
            <Text style={styles.guestDetailText}>Bàn {item.tableNumber}</Text>
          </View>
        )}
      </View>

      {/* Email info for invitation confirmed guests */}
      {item.confirmedViaInvitation && item.email && (
        <View style={styles.emailInfo}>
          <Mail size={12} color="#6b7280" />
          <Text style={styles.emailText}>{item.email}</Text>
        </View>
      )}

      {/* Gift Info Row */}
      {item.gift?.type && (
        <View style={styles.guestAdditionalInfo}>
          {item.gift.type === "money" && item.gift.amount && (
            <View style={styles.guestInfoTag}>
              <Text style={styles.guestInfoTagText}>
                💰 {formatCurrency(item.gift.amount)}
              </Text>
            </View>
          )}
          {item.gift.type === "item" && item.gift.description && (
            <View style={styles.guestInfoTag}>
              <Text style={styles.guestInfoTagText}>
                🎁 {item.gift.description}
              </Text>
            </View>
          )}
          {item.gift.type === "both" && (
            <>
              {item.gift.amount && (
                <View style={styles.guestInfoTag}>
                  <Text style={styles.guestInfoTagText}>
                    💰 {formatCurrency(item.gift.amount)}
                  </Text>
                </View>
              )}
              {item.gift.description && (
                <View style={styles.guestInfoTag}>
                  <Text style={styles.guestInfoTagText}>
                    🎁 {item.gift.description}
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      )}

      {item.notes && (
        <Text style={styles.guestNotes} numberOfLines={1}>
          📝 {item.notes}
        </Text>
      )}
    </TouchableOpacity>
  );

  // Nếu chưa có wedding event, hiển thị loading hoặc message
  if (!weddingEvent?._id) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý khách mời</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Loading State */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9d" />
          <Text style={styles.loadingText}>
            Đang tải thông tin sự kiện cưới...
          </Text>
          <Text style={styles.emptyText}>
            Vui lòng đảm bảo bạn đã tạo sự kiện cưới
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý khách mời</Text>
        <View style={styles.headerButtons}>
          {/* <TouchableOpacity
            onPress={() => {
              if (weddingEvent?._id) {
                navigation.navigate("NotificationListScreen", {
                  weddingEventId: weddingEvent._id,
                });
              }
            }}
            style={styles.exportButton}
          >
            <Bell size={24} color="#ff6b9d" />
          </TouchableOpacity> */}
          <TouchableOpacity
            onPress={handleImportFromContacts}
            disabled={isImporting}
            style={styles.exportButton}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#ff6b9d" />
            ) : (
              <UserPlus size={24} color="#ff6b9d" />
            )}
          </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={handleImportExcel}
            disabled={isImporting}
            style={styles.exportButton}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color="#ff6b9d" />
            ) : (
              <Upload size={24} color="#ff6b9d" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleExportExcel}
            disabled={isExporting || guests.length === 0}
            style={styles.exportButton}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#ff6b9d" />
            ) : (
              <Download
                size={24}
                color={guests.length === 0 ? "#d1d5db" : "#ff6b9d"}
              />
            )}
          </TouchableOpacity> */}
          <TouchableOpacity onPress={handleAddGuest}>
            <Plus size={24} color="#ff6b9d" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Guest List with All Sections */}
      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ff6b9d" />
          <Text style={styles.loadingText}>Đang tải danh sách...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredGuests}
          renderItem={renderGuestCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Platform.OS === "android"
                  ? responsiveHeight(16) + insets.bottom
                  : responsiveHeight(16),
            },
          ]}
          // ✅ OPTIMIZED: Performance improvements for large lists
          windowSize={10}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews={true}
          initialNumToRender={15}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#ff6b9d"]}
              tintColor="#ff6b9d"
            />
          }
          ListHeaderComponent={
            <>
              {/* Mini CRM Stats Dashboard */}
              {stats && (
                <View style={styles.statsSection}>
                  <Text style={styles.sectionTitle}>Tổng quan</Text>

                  {/* Main Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View
                      style={[
                        styles.statCardNew,
                        { borderLeftColor: "#6366f1" },
                      ]}
                    >
                      <View style={styles.statTopRow}>
                        <View style={styles.statIconContainer}>
                          <Users size={20} color="#6366f1" />
                        </View>
                        <Text style={styles.statNumberNew}>{stats.total}</Text>
                      </View>
                      <Text style={styles.statLabelNew}>Tổng số khách</Text>
                    </View>

                    <View
                      style={[
                        styles.statCardNew,
                        { borderLeftColor: "#10b981" },
                      ]}
                    >
                      <View style={styles.statTopRow}>
                        <View
                          style={[
                            styles.statIconContainer,
                            { backgroundColor: "#d1fae5" },
                          ]}
                        >
                          <CheckCircle size={20} color="#10b981" />
                        </View>
                        <Text style={styles.statNumberNew}>
                          {stats.confirmed}
                        </Text>
                      </View>
                      <Text style={styles.statLabelNew}>Xác nhận</Text>
                    </View>

                    <View
                      style={[
                        styles.statCardNew,
                        { borderLeftColor: "#f59e0b" },
                      ]}
                    >
                      <View style={styles.statTopRow}>
                        <View
                          style={[
                            styles.statIconContainer,
                            { backgroundColor: "#fef3c7" },
                          ]}
                        >
                          <Clock size={20} color="#f59e0b" />
                        </View>
                        <Text style={styles.statNumberNew}>
                          {stats.pending}
                        </Text>
                      </View>
                      <Text style={styles.statLabelNew}>Chờ phản hồi</Text>
                    </View>

                    <View
                      style={[
                        styles.statCardNew,
                        { borderLeftColor: "#ef4444" },
                      ]}
                    >
                      <View style={styles.statTopRow}>
                        <View
                          style={[
                            styles.statIconContainer,
                            { backgroundColor: "#fee2e2" },
                          ]}
                        >
                          <XCircle size={20} color="#ef4444" />
                        </View>
                        <Text style={styles.statNumberNew}>
                          {stats.declined}
                        </Text>
                      </View>
                      <Text style={styles.statLabelNew}>Từ chối</Text>
                    </View>
                  </View>

                  {/* Invitation Stats */}
                  <View style={styles.invitationStats}>
                    <View style={styles.invitationStatItem}>
                      <View style={styles.invitationStatDot} />
                      <Text style={styles.invitationStatText}>
                        Đã gửi:{" "}
                        <Text style={styles.invitationStatNumber}>
                          {stats.invitationSent || 0}
                        </Text>
                      </Text>
                    </View>
                    <View style={styles.invitationStatItem}>
                      <View
                        style={[
                          styles.invitationStatDot,
                          { backgroundColor: "#9ca3af" },
                        ]}
                      />
                      <Text style={styles.invitationStatText}>
                        Chưa gửi:{" "}
                        <Text style={styles.invitationStatNumber}>
                          {stats.total - (stats.invitationSent || 0)}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  {stats.total > 0 && (
                    <View style={styles.progressSection}>
                      <View style={styles.progressHeader}>
                        <Text style={styles.progressLabel}>Tỷ lệ xác nhận</Text>
                        <Text style={styles.progressPercentage}>
                          {Math.round((stats.confirmed / stats.total) * 100)}%
                        </Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${
                                (stats.confirmed / stats.total) * 100
                              }%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* Enhanced Table Suggestions */}
              {tableSuggestions &&
                (() => {
                  const state = require("../../store").store.getState();
                  const user = selectCurrentUser(state);
                  const accountType = user?.accountType || "FREE";
                  const limits = getAccountLimits(accountType);

                  if (!limits.canAccessTableArrangement) {
                    return (
                      <TouchableOpacity
                        style={[
                          styles.tableSuggestionSection,
                          { opacity: 0.6 },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Nâng cấp tài khoản",
                            getUpgradeMessage("tableArrangement"),
                            [
                              { text: "Hủy", style: "cancel" },
                              {
                                text: "Nâng cấp",
                                onPress: () =>
                                  navigation.navigate("UpgradeAccountScreen"),
                              },
                            ]
                          );
                        }}
                      >
                        <View style={styles.tableSuggestionHeaderNew}>
                          <View style={styles.tableSuggestionIconWrapper}>
                            <Table size={24} color="#ff6b9d" />
                          </View>
                          <View style={styles.tableSuggestionTitleWrapper}>
                            <Text style={styles.tableSuggestionTitleNew}>
                              Gợi ý bố trí bàn 🔒
                            </Text>
                            <Text style={styles.tableSuggestionSubtitle}>
                              Nâng cấp VIP để mở khóa
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <View style={styles.tableSuggestionSection}>
                      <View style={styles.tableSuggestionHeaderNew}>
                        <View style={styles.tableSuggestionIconWrapper}>
                          <Table size={24} color="#ff6b9d" />
                        </View>
                        <View style={styles.tableSuggestionTitleWrapper}>
                          <Text style={styles.tableSuggestionTitleNew}>
                            Gợi ý bố trí bàn
                          </Text>
                          <Text style={styles.tableSuggestionSubtitle}>
                            Dựa trên {stats?.confirmed || 0} khách xác nhận
                          </Text>
                        </View>
                      </View>

                      <View style={styles.tableSuggestionContent}>
                        {/* Table Configuration */}
                        <View style={styles.tableConfigSection}>
                          <Text style={styles.tableConfigLabel}>
                            Cấu hình bàn tiệc
                          </Text>
                          <View style={styles.tableConfigControl}>
                            <TouchableOpacity
                              style={styles.tableConfigButton}
                              onPress={() =>
                                handleGuestsPerTableChange(guestsPerTable - 1)
                              }
                              disabled={guestsPerTable <= 6}
                            >
                              <Text
                                style={[
                                  styles.tableConfigButtonText,
                                  guestsPerTable <= 6 &&
                                    styles.tableConfigButtonDisabled,
                                ]}
                              >
                                −
                              </Text>
                            </TouchableOpacity>
                            <View style={styles.tableConfigValueContainer}>
                              <Text style={styles.tableConfigValue}>
                                {guestsPerTable}
                              </Text>
                              <Text style={styles.tableConfigUnit}>
                                người/bàn
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.tableConfigButton}
                              onPress={() =>
                                handleGuestsPerTableChange(guestsPerTable + 1)
                              }
                              disabled={guestsPerTable >= 15}
                            >
                              <Text
                                style={[
                                  styles.tableConfigButtonText,
                                  guestsPerTable >= 15 &&
                                    styles.tableConfigButtonDisabled,
                                ]}
                              >
                                +
                              </Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.tableConfigHint}>
                            Điều chỉnh từ 6 - 15 người/bàn
                          </Text>
                        </View>

                        {/* Main Tables Info */}
                        <View style={styles.tableSuggestionBreakdown}>
                          <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>
                              Số bàn tối thiểu
                            </Text>
                            <Text style={styles.breakdownValue}>
                              {tableSuggestions.confirmedTables}
                            </Text>
                            <Text style={styles.breakdownSubtext}>bàn</Text>
                            <Text style={styles.breakdownNote}>
                              (
                              {tableSuggestions.breakdown?.confirmedGuests || 0}{" "}
                              khách xác nhận)
                            </Text>
                          </View>
                          <View style={styles.breakdownDivider} />
                          <View style={styles.breakdownItem}>
                            <Text style={styles.breakdownLabel}>
                              Số bàn dự phòng
                            </Text>
                            <Text style={styles.breakdownValue}>
                              {tableSuggestions.reserveTables}
                            </Text>
                            <Text style={styles.breakdownSubtext}>bàn</Text>
                            <Text style={styles.breakdownNote}>
                              (15% dự phòng)
                            </Text>
                          </View>
                        </View>

                        {/* Guest Breakdown */}
                        <View style={styles.guestBreakdownSection}>
                          <View style={styles.guestBreakdownRow}>
                            <View style={styles.guestBreakdownItem}>
                              <View
                                style={[
                                  styles.guestBreakdownDot,
                                  { backgroundColor: "#10b981" },
                                ]}
                              />
                              <Text style={styles.guestBreakdownText}>
                                Đã xác nhận:{" "}
                                {tableSuggestions.breakdown?.confirmedGuests ||
                                  0}
                              </Text>
                            </View>
                            <View style={styles.guestBreakdownItem}>
                              <View
                                style={[
                                  styles.guestBreakdownDot,
                                  { backgroundColor: "#f59e0b" },
                                ]}
                              />
                              <Text style={styles.guestBreakdownText}>
                                Chờ phản hồi:{" "}
                                {tableSuggestions.breakdown?.pendingGuests || 0}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View style={styles.confirmationRateBadge}>
                          <Text style={styles.confirmationRateText}>
                            ✨ Tỷ lệ xác nhận:{" "}
                            {stats && stats.total && stats.total > 0
                              ? Math.round(
                                  (stats.confirmed / stats.total) * 100
                                )
                              : 0}
                            %
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

              {/* Send Thank You Emails Section */}
              {stats && stats.confirmed > 0 && (
                <View style={styles.thankYouSection}>
                  <View style={styles.thankYouHeader}>
                    <View style={styles.thankYouIconWrapper}>
                      <Mail size={24} color="#ff6b9d" />
                    </View>
                    <View style={styles.thankYouTitleWrapper}>
                      <Text style={styles.thankYouTitle}>Gửi email cảm ơn</Text>
                      <Text style={styles.thankYouSubtitle}>
                        Tới {stats.confirmed} khách đã tham dự
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.thankYouButton}
                    onPress={handleSendThankYouEmails}
                    disabled={sendingThankYou}
                  >
                    <Text style={styles.thankYouButtonText}>
                      {sendingThankYou ? "Đang gửi..." : "Gửi email ngay"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Search and Filter */}
              <View style={styles.searchContainer}>
                <View style={styles.searchBox}>
                  <Search size={20} color="#9ca3af" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Tìm kiếm khách mời..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowFilterModal(true)}
                >
                  <Filter size={20} color="#ff6b9d" />
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <UserPlus size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Chưa có khách mời nào</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddGuest}
              >
                <Text style={styles.addButtonText}>Thêm khách mời</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Add Guest Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Thêm khách mời</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={{ paddingBottom: responsiveHeight(100) }}
              showsVerticalScrollIndicator={true}
            >
              <Text style={styles.label}>
                Tên khách mời <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên đầy đủ"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
              />

              <Text style={styles.label}>Nhóm khách</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.group === "groom" && styles.groupButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, group: "groom" })}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.group === "groom" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Nhà trai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.group === "bride" && styles.groupButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, group: "bride" })}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.group === "bride" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Nhà gái
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.group === "both" && styles.groupButtonActive,
                  ]}
                  onPress={() => setFormData({ ...formData, group: "both" })}
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.group === "both" && styles.groupButtonTextActive,
                    ]}
                  >
                    Chung
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Mối quan hệ</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.relationship === "family" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, relationship: "family" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.relationship === "family" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Gia đình
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.relationship === "friend" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, relationship: "friend" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.relationship === "friend" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Bạn bè
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    formData.relationship === "colleague" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, relationship: "colleague" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      formData.relationship === "colleague" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Đồng nghiệp
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={formData.phoneNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, phoneNumber: text })
                }
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) =>
                  setFormData({ ...formData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Số người đi cùng</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      numberOfCompanions: Math.max(
                        0,
                        formData.numberOfCompanions - 1
                      ),
                    })
                  }
                >
                  <Text style={styles.numberButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.numberValue}>
                  {formData.numberOfCompanions}
                </Text>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() =>
                    setFormData({
                      ...formData,
                      numberOfCompanions: formData.numberOfCompanions + 1,
                    })
                  }
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="VD: Ăn chay, VIP, Thích bàn gần sân khấu..."
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                multiline
                numberOfLines={3}
                textContentType="none"
                autoComplete="off"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleCreateGuest}
            >
              <Text style={styles.submitButtonText}>Thêm khách mời</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Guest Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.addModal}>
            <View style={styles.addModalHeader}>
              <Text style={styles.addModalTitle}>Chỉnh sửa khách mời</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <XCircle size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.formContainer}
              contentContainerStyle={{ paddingBottom: responsiveHeight(20) }}
            >
              <Text style={styles.label}>Tên khách mời</Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập tên khách mời"
                value={editFormData.name}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, name: text })
                }
              />

              <Text style={styles.label}>Nhóm khách</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.group === "groom" && styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({ ...editFormData, group: "groom" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.group === "groom" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Nhà trai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.group === "bride" && styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({ ...editFormData, group: "bride" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.group === "bride" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Nhà gái
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.group === "both" && styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({ ...editFormData, group: "both" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.group === "both" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Chung
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Mối quan hệ</Text>
              <View style={styles.buttonGroup}>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.relationship === "family" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({ ...editFormData, relationship: "family" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.relationship === "family" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Gia đình
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.relationship === "friend" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({ ...editFormData, relationship: "friend" })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.relationship === "friend" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Bạn bè
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.groupButton,
                    editFormData.relationship === "colleague" &&
                      styles.groupButtonActive,
                  ]}
                  onPress={() =>
                    setEditFormData({
                      ...editFormData,
                      relationship: "colleague",
                    })
                  }
                >
                  <Text
                    style={[
                      styles.groupButtonText,
                      editFormData.relationship === "colleague" &&
                        styles.groupButtonTextActive,
                    ]}
                  >
                    Đồng nghiệp
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Số điện thoại</Text>
              <TextInput
                style={styles.input}
                placeholder="Số điện thoại"
                value={editFormData.phoneNumber}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, phoneNumber: text })
                }
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>
                Email{" "}
                {!editFormData.email && (
                  <Text style={styles.labelWarning}>(chưa có)</Text>
                )}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  !editFormData.email && styles.inputWarning,
                ]}
                placeholder="Nhập email để nhận lời cảm ơn"
                value={editFormData.email}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, email: text })
                }
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!editFormData.email && (
                <Text style={styles.helperText}>
                  💡 Thêm email để khách có thể nhận email cảm ơn sau lễ cưới
                </Text>
              )}

              <Text style={styles.label}>Địa chỉ</Text>
              <TextInput
                style={styles.input}
                placeholder="Địa chỉ"
                value={editFormData.address}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, address: text })
                }
              />

              <Text style={styles.label}>Số người đi cùng</Text>
              <View style={styles.numberInputContainer}>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() =>
                    setEditFormData({
                      ...editFormData,
                      numberOfCompanions: Math.max(
                        0,
                        editFormData.numberOfCompanions - 1
                      ),
                    })
                  }
                >
                  <Text style={styles.numberButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.numberValue}>
                  {editFormData.numberOfCompanions}
                </Text>
                <TouchableOpacity
                  style={styles.numberButton}
                  onPress={() =>
                    setEditFormData({
                      ...editFormData,
                      numberOfCompanions: editFormData.numberOfCompanions + 1,
                    })
                  }
                >
                  <Text style={styles.numberButtonText}>+</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Ghi chú</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="VD: Ăn chay, VIP, Thích bàn gần sân khấu..."
                value={editFormData.notes}
                onChangeText={(text) =>
                  setEditFormData({ ...editFormData, notes: text })
                }
                multiline
                numberOfLines={3}
                textContentType="none"
                autoComplete="off"
              />

              {/* Gift Section */}
              <View style={styles.giftSection}>
                <View style={styles.giftSectionHeader}>
                  <Gift size={20} color="#ff6b9d" />
                  <Text style={styles.giftSectionTitle}>Quà mừng cưới</Text>
                </View>

                <Text style={styles.label}>Loại quà mừng</Text>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    style={[
                      styles.groupButton,
                      editFormData.giftType === "none" &&
                        styles.groupButtonActive,
                    ]}
                    onPress={() =>
                      setEditFormData({ ...editFormData, giftType: "none" })
                    }
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        editFormData.giftType === "none" &&
                          styles.groupButtonTextActive,
                      ]}
                    >
                      Chưa có
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupButton,
                      editFormData.giftType === "money" &&
                        styles.groupButtonActive,
                    ]}
                    onPress={() =>
                      setEditFormData({ ...editFormData, giftType: "money" })
                    }
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        editFormData.giftType === "money" &&
                          styles.groupButtonTextActive,
                      ]}
                    >
                      Tiền mặt
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupButton,
                      editFormData.giftType === "item" &&
                        styles.groupButtonActive,
                    ]}
                    onPress={() =>
                      setEditFormData({ ...editFormData, giftType: "item" })
                    }
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        editFormData.giftType === "item" &&
                          styles.groupButtonTextActive,
                      ]}
                    >
                      Quà tặng
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.groupButton,
                      editFormData.giftType === "both" &&
                        styles.groupButtonActive,
                    ]}
                    onPress={() =>
                      setEditFormData({ ...editFormData, giftType: "both" })
                    }
                  >
                    <Text
                      style={[
                        styles.groupButtonText,
                        editFormData.giftType === "both" &&
                          styles.groupButtonTextActive,
                      ]}
                    >
                      Cả hai
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Gift Amount */}
                {(editFormData.giftType === "money" ||
                  editFormData.giftType === "both") && (
                  <>
                    <Text style={styles.label}>Số tiền (VNĐ)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập số tiền"
                      value={formatCurrency(
                        parseInt(editFormData.giftAmount || "0")
                      )}
                      onChangeText={(text) =>
                        setEditFormData({
                          ...editFormData,
                          giftAmount: text.replace(/[^0-9]/g, ""),
                        })
                      }
                      keyboardType="numeric"
                    />
                    {editFormData.giftAmount && (
                      <Text style={styles.amountPreview}>
                        {parseInt(editFormData.giftAmount).toLocaleString(
                          "vi-VN"
                        )}{" "}
                        đồng
                      </Text>
                    )}
                  </>
                )}

                {/* Gift Description */}
                {editFormData.giftType !== "none" && (
                  <>
                    <Text style={styles.label}>Mô tả quà tặng</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="VD: Bộ chén sứ, Tranh treo tường, Voucher du lịch..."
                      value={editFormData.giftDescription}
                      onChangeText={(text) =>
                        setEditFormData({
                          ...editFormData,
                          giftDescription: text,
                        })
                      }
                      multiline
                      numberOfLines={3}
                    />
                  </>
                )}

                {/* Received Date */}
                {editFormData.giftType !== "none" && (
                  <>
                    <Text style={styles.label}>Ngày nhận quà</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowEditDatePicker(true)}
                    >
                      <Calendar size={20} color="#6b7280" />
                      <Text style={styles.datePickerText}>
                        {new Date(
                          editFormData.giftReceivedDate
                        ).toLocaleDateString("vi-VN")}
                      </Text>
                    </TouchableOpacity>
                    {showEditDatePicker && (
                      <DateTimePicker
                        value={new Date(editFormData.giftReceivedDate)}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={(event, selectedDate) => {
                          setShowEditDatePicker(Platform.OS === "ios");
                          if (selectedDate) {
                            setEditFormData({
                              ...editFormData,
                              giftReceivedDate: selectedDate.toISOString(),
                            });
                          }
                        }}
                      />
                    )}
                  </>
                )}

                {/* Received Method */}
                {editFormData.giftType !== "none" && (
                  <>
                    <Text style={styles.label}>Hình thức nhận quà</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.methodScrollView}
                    >
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          editFormData.giftReceivedMethod === "at_event" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            giftReceivedMethod: "at_event",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            editFormData.giftReceivedMethod === "at_event" &&
                              styles.methodButtonTextActive,
                          ]}
                        >
                          Tại tiệc
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          editFormData.giftReceivedMethod === "bank_transfer" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            giftReceivedMethod: "bank_transfer",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            editFormData.giftReceivedMethod ===
                              "bank_transfer" && styles.methodButtonTextActive,
                          ]}
                        >
                          Chuyển khoản
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          editFormData.giftReceivedMethod === "before_event" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            giftReceivedMethod: "before_event",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            editFormData.giftReceivedMethod ===
                              "before_event" && styles.methodButtonTextActive,
                          ]}
                        >
                          Trước tiệc
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          editFormData.giftReceivedMethod === "after_event" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            giftReceivedMethod: "after_event",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            editFormData.giftReceivedMethod === "after_event" &&
                              styles.methodButtonTextActive,
                          ]}
                        >
                          Sau tiệc
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.methodButton,
                          editFormData.giftReceivedMethod === "not_received" &&
                            styles.methodButtonActive,
                        ]}
                        onPress={() =>
                          setEditFormData({
                            ...editFormData,
                            giftReceivedMethod: "not_received",
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.methodButtonText,
                            editFormData.giftReceivedMethod ===
                              "not_received" && styles.methodButtonTextActive,
                          ]}
                        >
                          Chưa nhận
                        </Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </>
                )}

                {/* Returned Gift Checkbox */}
                {editFormData.giftType !== "none" && (
                  <>
                    <TouchableOpacity
                      style={styles.checkboxRow}
                      onPress={() =>
                        setEditFormData({
                          ...editFormData,
                          giftReturnedGift: !editFormData.giftReturnedGift,
                        })
                      }
                    >
                      {editFormData.giftReturnedGift ? (
                        <CheckSquare size={24} color="#ff6b9d" />
                      ) : (
                        <Square size={24} color="#6b7280" />
                      )}
                      <Text style={styles.checkboxLabel}>Đã trả lễ</Text>
                    </TouchableOpacity>
                    <Text style={styles.checkboxHint}>
                      Đánh dấu nếu bạn đã tặng quà đáp lễ cho khách mời này
                    </Text>
                  </>
                )}

                {editFormData.giftType !== "none" && (
                  <View style={styles.giftInfoCard}>
                    <Gift size={16} color="#ff6b9d" />
                    <Text style={styles.giftInfoText}>
                      Thông tin quà mừng giúp bạn ghi nhận và tổng kết sau lễ
                      cưới
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleUpdateGuest}
            >
              <Text style={styles.submitButtonText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Lọc khách mời</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Text style={styles.cancelText}>Đóng</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.filterContent}>
              <Text style={styles.filterSectionTitle}>Nhóm khách</Text>
              <View style={styles.filterButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterGroup === null && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterGroup(null);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterGroup === null && styles.filterButtonTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterGroup === "groom" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterGroup("groom");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterGroup === "groom" && styles.filterButtonTextActive,
                    ]}
                  >
                    Nhà trai
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterGroup === "bride" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterGroup("bride");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterGroup === "bride" && styles.filterButtonTextActive,
                    ]}
                  >
                    Nhà gái
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterGroup === "both" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterGroup("both");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterGroup === "both" && styles.filterButtonTextActive,
                    ]}
                  >
                    Chung
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Trạng thái</Text>
              <View style={styles.filterButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === null && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterStatus(null);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === null && styles.filterButtonTextActive,
                    ]}
                  >
                    Tất cả
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "confirmed" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterStatus("confirmed");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === "confirmed" &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Xác nhận
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "pending" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterStatus("pending");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === "pending" &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Chờ
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "declined" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setFilterStatus("declined");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filterStatus === "declined" &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    Từ chối
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterSectionTitle}>Sắp xếp theo tên</Text>
              <View style={styles.filterButtonGroup}>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    sortByName === null && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setSortByName(null);
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortByName === null && styles.filterButtonTextActive,
                    ]}
                  >
                    Mặc định
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    sortByName === "asc" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setSortByName("asc");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortByName === "asc" && styles.filterButtonTextActive,
                    ]}
                  >
                    A → Z
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    sortByName === "desc" && styles.filterButtonActive,
                  ]}
                  onPress={() => {
                    setSortByName("desc");
                    setShowFilterModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      sortByName === "desc" && styles.filterButtonTextActive,
                    ]}
                  >
                    Z → A
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={() => {
                  setFilterGroup(null);
                  setFilterStatus(null);
                  setSortByName(null);
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.clearFilterText}>Xóa bộ lọc</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Guest Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuModal}>
            <Text style={styles.menuModalTitle}>{selectedGuest?.name}</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleEditGuest(selectedGuest)}
            >
              <Edit size={20} color="#6b7280" />
              <Text style={styles.menuItemText}>Chỉnh sửa</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleUpdateAttendance(selectedGuest?._id, "confirmed")
              }
            >
              <CheckCircle size={20} color="#10b981" />
              <Text style={styles.menuItemText}>Đánh dấu xác nhận</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() =>
                handleUpdateAttendance(selectedGuest?._id, "declined")
              }
            >
              <XCircle size={20} color="#ef4444" />
              <Text style={styles.menuItemText}>Đánh dấu từ chối</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.menuItem,
                { borderTopWidth: 1, borderTopColor: "#f3f4f6" },
              ]}
              onPress={() => handleDeleteGuest(selectedGuest?._id)}
            >
              <Trash2 size={20} color="#ef4444" />
              <Text style={[styles.menuItemText, { color: "#ef4444" }]}>
                Xóa khách mời
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Import Preview Modal */}
      <Modal
        visible={showImportPreview}
        transparent
        animationType="slide"
        onRequestClose={() => setShowImportPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.importPreviewModal}>
            <View style={styles.importPreviewHeader}>
              <Text style={styles.importPreviewTitle}>
                Xem trước danh sách import
              </Text>
              <TouchableOpacity onPress={() => setShowImportPreview(false)}>
                <XCircle size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.importPreviewInfo}>
              <Text style={styles.importPreviewInfoText}>
                Tìm thấy{" "}
                <Text style={styles.importPreviewCount}>
                  {importData.length}
                </Text>{" "}
                khách mời
              </Text>
            </View>

            <ScrollView style={styles.importPreviewList}>
              {importData.slice(0, 10).map((guest, index) => (
                <View key={index} style={styles.importPreviewItem}>
                  <Text style={styles.importPreviewItemName}>
                    {index + 1}. {guest.name}
                  </Text>
                  <Text style={styles.importPreviewItemDetail}>
                    {guest.phoneNumber} •{" "}
                    {guest.group === "groom" ? "Nhà trai" : "Nhà gái"}
                  </Text>
                </View>
              ))}
              {importData.length > 10 && (
                <Text style={styles.importPreviewMore}>
                  ... và {importData.length - 10} khách mời khác
                </Text>
              )}
            </ScrollView>

            <View style={styles.importPreviewButtons}>
              <TouchableOpacity
                style={styles.importCancelButton}
                onPress={() => {
                  setShowImportPreview(false);
                  setImportData([]);
                }}
              >
                <Text style={styles.importCancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.importConfirmButton}
                onPress={handleConfirmImport}
                disabled={isImporting}
              >
                {isImporting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.importConfirmButtonText}>
                    Import {importData.length} khách
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: responsiveWidth(20),
    paddingVertical: responsiveHeight(18),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  headerTitle: {
    fontFamily: "Agbalumo",
    fontSize: responsiveFont(16),
    color: "#1f2937",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  exportButton: {
    padding: 4,
  },
  // New Mini CRM Stats Styles
  statsSection: {
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(16),
    paddingBottom: responsiveHeight(8),
  },
  sectionTitle: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginBottom: responsiveHeight(12),
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(12),
    marginBottom: responsiveHeight(16),
  },
  statCardNew: {
    flex: 1,
    minWidth: "47%",
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: responsiveWidth(36),
    height: responsiveWidth(36),
    borderRadius: responsiveWidth(18),
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
    marginRight: responsiveWidth(12),
  },
  statTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(8),
  },
  statNumberNew: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(28),
    color: "#1f2937",
  },
  statLabelNew: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  invitationStats: {
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: responsiveHeight(16),
  },
  invitationStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(6),
  },
  invitationStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  invitationStatText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  invitationStatNumber: {
    fontFamily: "Montserrat-Bold",
    color: "#1f2937",
  },
  progressSection: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(8),
  },
  progressLabel: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  progressPercentage: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(16),
    color: "#ff6b9d",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#ff6b9d",
    borderRadius: 4,
  },
  // New Table Suggestion Styles
  tableSuggestionSection: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(16),
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(16),
    borderWidth: 2,
    borderColor: "#ff6b9d",
    overflow: "hidden",
  },
  tableSuggestionHeaderNew: {
    flexDirection: "row",
    alignItems: "center",
    padding: responsiveWidth(16),
    backgroundColor: "#fef3f2",
    gap: responsiveWidth(12),
  },
  tableSuggestionIconWrapper: {
    width: responsiveWidth(48),
    height: responsiveWidth(48),
    borderRadius: responsiveWidth(24),
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b9d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tableSuggestionTitleWrapper: {
    flex: 1,
  },
  tableSuggestionTitleNew: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    marginBottom: responsiveHeight(2),
  },
  tableSuggestionSubtitle: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  tableSuggestionContent: {
    padding: responsiveWidth(16),
  },
  tableConfigSection: {
    backgroundColor: "#f9fafb",
    padding: responsiveWidth(16),
    borderRadius: responsiveWidth(8),
    marginBottom: responsiveHeight(12),
    alignItems: "center",
  },
  tableConfigLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginBottom: responsiveHeight(8),
  },
  tableConfigControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(16),
    marginBottom: responsiveHeight(8),
  },
  tableConfigButton: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    backgroundColor: "#ff6b9d",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff6b9d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tableConfigButtonText: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(24),
    color: "#ffffff",
  },
  tableConfigButtonDisabled: {
    color: "#d1d5db",
  },
  tableConfigValueContainer: {
    alignItems: "center",
    minWidth: responsiveWidth(100),
  },
  tableConfigValue: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(32),
    color: "#ff6b9d",
    lineHeight: responsiveFont(36),
  },
  tableConfigUnit: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  tableConfigHint: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(11),
    color: "#9ca3af",
    textAlign: "center",
  },
  tableSuggestionMain: {
    alignItems: "center",
    paddingVertical: responsiveHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableSuggestionLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    marginBottom: responsiveHeight(8),
  },
  tableSuggestionNumberWrapper: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: responsiveWidth(8),
    marginBottom: responsiveHeight(8),
  },
  tableSuggestionNumberLarge: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(48),
    color: "#ff6b9d",
    lineHeight: responsiveFont(52),
  },
  tableSuggestionUnit: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#6b7280",
  },
  tableSuggestionDetail: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    textAlign: "center",
  },
  tableSuggestionBreakdown: {
    flexDirection: "row",
    paddingVertical: responsiveHeight(16),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  breakdownItem: {
    flex: 1,
    alignItems: "center",
  },
  breakdownLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#9ca3af",
    marginBottom: responsiveHeight(6),
  },
  breakdownValue: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(24),
    color: "#ff6b9d",
    marginBottom: responsiveHeight(4),
  },
  breakdownSubtext: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(11),
    color: "#9ca3af",
  },
  breakdownNote: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(10),
    color: "#9ca3af",
    marginTop: responsiveHeight(4),
    textAlign: "center",
  },
  breakdownDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: responsiveWidth(16),
  },
  guestBreakdown: {
    paddingVertical: responsiveHeight(16),
    gap: responsiveHeight(8),
  },
  guestBreakdownSection: {
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(8),
  },
  guestBreakdownRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: responsiveWidth(12),
  },
  guestBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  guestBreakdownDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  guestBreakdownText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  confirmationRateBadge: {
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(8),
    paddingVertical: responsiveHeight(8),
    paddingHorizontal: responsiveWidth(12),
    alignItems: "center",
    marginTop: responsiveHeight(8),
  },
  confirmationRateText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#ff6b9d",
  },
  // Keep old styles for backward compatibility
  statsContainer: {
    flexDirection: "row",
    padding: responsiveWidth(16),
    gap: responsiveWidth(8),
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(12),
    alignItems: "center",
  },
  statNumber: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(24),
    color: "#ff6b9d",
    marginBottom: responsiveHeight(4),
  },
  statLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  tableSuggestionCard: {
    marginHorizontal: responsiveWidth(16),
    marginBottom: responsiveHeight(16),
    padding: responsiveWidth(16),
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(12),
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  tableSuggestionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
    marginBottom: responsiveHeight(8),
  },
  tableSuggestionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#1f2937",
  },
  tableSuggestionText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
    lineHeight: responsiveHeight(20),
  },
  tableSuggestionHighlight: {
    fontFamily: "Montserrat-Bold",
    color: "#ff6b9d",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: responsiveWidth(16),
    paddingTop: responsiveHeight(8),
    paddingBottom: responsiveHeight(12),
    gap: responsiveWidth(12),
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    gap: responsiveWidth(8),
  },
  searchInput: {
    flex: 1,
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    paddingVertical: responsiveHeight(12),
  },
  filterButton: {
    width: responsiveWidth(70),
    height: responsiveWidth(48),
    backgroundColor: "#fef3f2",
    borderRadius: responsiveWidth(12),
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
    marginTop: responsiveHeight(12),
  },
  listContent: {
    paddingHorizontal: responsiveWidth(16),
    paddingBottom:
      Platform.OS === "ios" ? responsiveHeight(100) : responsiveHeight(80),
  },
  guestCard: {
    backgroundColor: "#ffffff",
    borderRadius: responsiveWidth(12),
    padding: responsiveWidth(16),
    marginBottom: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#f3f4f6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  guestCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: responsiveHeight(12),
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  guestMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(8),
  },
  groupBadge: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#ff6b9d",
    backgroundColor: "#fef3f2",
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(4),
    borderRadius: responsiveWidth(6),
  },
  categoryText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  guestCardBody: {
    flexDirection: "row",
    gap: responsiveWidth(16),
  },
  guestDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(4),
  },
  guestDetailText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  guestNotes: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#9ca3af",
    marginTop: responsiveHeight(8),
    fontStyle: "italic",
  },
  guestAdditionalInfo: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
    marginTop: responsiveHeight(8),
  },
  guestInfoTag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: responsiveWidth(10),
    paddingVertical: responsiveHeight(4),
    borderRadius: responsiveWidth(6),
  },
  guestInfoTagText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(11),
    color: "#4b5563",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: responsiveHeight(60),
  },
  emptyText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#9ca3af",
    marginTop: responsiveHeight(12),
    marginBottom: responsiveHeight(24),
  },
  addButton: {
    backgroundColor: "#ff6b9d",
    paddingHorizontal: responsiveWidth(24),
    paddingVertical: responsiveHeight(12),
    borderRadius: responsiveWidth(12),
  },
  addButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(14),
    color: "#ffffff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  addModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(20),
    borderTopRightRadius: responsiveWidth(20),
    maxHeight: "90%",
    flex: 1,
  },
  addModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  addModalTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  cancelText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(15),
    color: "#9ca3af",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: responsiveWidth(20),
    paddingTop: responsiveHeight(12),
    paddingBottom: responsiveHeight(20),
  },
  label: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    marginBottom: responsiveHeight(8),
    marginTop: responsiveHeight(12),
  },
  required: {
    color: "#ef4444",
  },
  input: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    borderRadius: responsiveWidth(12),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  textArea: {
    minHeight: responsiveHeight(80),
    textAlignVertical: "top",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: responsiveWidth(8),
  },
  groupButton: {
    flex: 1,
    paddingVertical: responsiveHeight(10),
    paddingHorizontal: responsiveWidth(8),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  groupButtonActive: {
    backgroundColor: "#fef3f2",
    borderColor: "#ff6b9d",
  },
  groupButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(11),
    color: "#6b7280",
  },
  groupButtonTextActive: {
    color: "#ff6b9d",
  },
  numberInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(16),
  },
  numberButton: {
    width: responsiveWidth(40),
    height: responsiveWidth(40),
    borderRadius: responsiveWidth(20),
    backgroundColor: "#ff6b9d",
    alignItems: "center",
    justifyContent: "center",
  },
  numberButtonText: {
    fontFamily: "Montserrat-Bold",
    fontSize: responsiveFont(20),
    color: "#ffffff",
  },
  numberValue: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    minWidth: responsiveWidth(40),
    textAlign: "center",
  },
  submitButton: {
    backgroundColor: "#ff6b9d",
    margin: responsiveWidth(20),
    paddingVertical: responsiveHeight(16),
    borderRadius: responsiveWidth(12),
    alignItems: "center",
  },
  submitButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#ffffff",
  },
  menuModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(20),
    borderTopRightRadius: responsiveWidth(20),
    padding: responsiveWidth(20),
  },
  menuModalTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
    marginBottom: responsiveHeight(16),
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: responsiveWidth(12),
    paddingVertical: responsiveHeight(16),
  },
  menuItemText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(15),
    color: "#1f2937",
  },
  filterModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(20),
    borderTopRightRadius: responsiveWidth(20),
    padding: responsiveWidth(20),
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: responsiveHeight(20),
  },
  filterModalTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  filterContent: {
    gap: responsiveHeight(20),
  },
  filterSectionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#1f2937",
    marginBottom: responsiveHeight(12),
  },
  filterButtonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: responsiveWidth(8),
  },
  filterButtonActive: {
    backgroundColor: "#ff6b9d",
  },
  filterButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#ffffff",
  },
  clearFilterButton: {
    marginTop: responsiveHeight(12),
    paddingVertical: responsiveHeight(12),
    paddingHorizontal: responsiveWidth(16),
    backgroundColor: "#f3f4f6",
    borderRadius: responsiveWidth(8),
    alignItems: "center",
  },
  clearFilterText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
  },
  importPreviewModal: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: responsiveWidth(20),
    borderTopRightRadius: responsiveWidth(20),
    maxHeight: "80%",
    marginTop: "auto",
  },
  importPreviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: responsiveWidth(20),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  importPreviewTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(18),
    color: "#1f2937",
  },
  importPreviewInfo: {
    padding: responsiveWidth(20),
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  importPreviewInfoText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#6b7280",
  },
  importPreviewCount: {
    fontFamily: "Montserrat-Bold",
    color: "#ff6b9d",
  },
  importPreviewList: {
    maxHeight: responsiveHeight(300),
    padding: responsiveWidth(20),
  },
  importPreviewItem: {
    paddingVertical: responsiveHeight(12),
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  importPreviewItemName: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#1f2937",
    marginBottom: responsiveHeight(4),
  },
  importPreviewItemDetail: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  importPreviewMore: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#9ca3af",
    textAlign: "center",
    marginTop: responsiveHeight(12),
  },
  importPreviewButtons: {
    flexDirection: "row",
    gap: responsiveWidth(12),
    padding: responsiveWidth(20),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  importCancelButton: {
    flex: 1,
    paddingVertical: responsiveHeight(14),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  importCancelButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#6b7280",
  },
  importConfirmButton: {
    flex: 1,
    paddingVertical: responsiveHeight(14),
    borderRadius: responsiveWidth(12),
    backgroundColor: "#ff6b9d",
    alignItems: "center",
  },
  importConfirmButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#ffffff",
  },
  // Thank you section
  thankYouSection: {
    backgroundColor: "#ffffff",
    padding: responsiveWidth(20),
    marginHorizontal: responsiveWidth(20),
    marginBottom: responsiveHeight(16),
    borderRadius: responsiveWidth(16),
    borderWidth: 1,
    borderColor: "#fecaca",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  thankYouHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(16),
  },
  thankYouIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fef3f2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: responsiveWidth(12),
  },
  thankYouTitleWrapper: {
    flex: 1,
  },
  thankYouTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    marginBottom: responsiveHeight(2),
  },
  thankYouSubtitle: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  thankYouButton: {
    backgroundColor: "#ff6b9d",
    paddingVertical: responsiveHeight(14),
    borderRadius: responsiveWidth(12),
    alignItems: "center",
  },
  thankYouButtonText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(15),
    color: "#ffffff",
  },
  // Invitation badge
  invitationBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: responsiveWidth(8),
    paddingVertical: responsiveHeight(3),
    borderRadius: responsiveWidth(6),
  },
  invitationBadgeText: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(10),
    color: "#1e40af",
  },
  // Email info
  emailInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: responsiveHeight(8),
    paddingTop: responsiveHeight(8),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  emailText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
  },
  // Email warning styles
  labelWarning: {
    color: "#f59e0b",
    fontSize: responsiveFont(12),
  },
  inputWarning: {
    borderColor: "#fbbf24",
    backgroundColor: "#fffbeb",
  },
  helperText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(6),
    fontStyle: "italic",
  },
  // Gift section styles
  giftSection: {
    marginTop: responsiveHeight(20),
    paddingTop: responsiveHeight(20),
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  giftSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: responsiveHeight(16),
  },
  giftSectionTitle: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(16),
    color: "#1f2937",
    marginLeft: responsiveWidth(8),
  },
  amountPreview: {
    fontFamily: "Montserrat-SemiBold",
    fontSize: responsiveFont(13),
    color: "#059669",
    marginTop: responsiveHeight(6),
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: responsiveWidth(8),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(12),
    marginTop: responsiveHeight(8),
  },
  datePickerText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    marginLeft: responsiveWidth(8),
  },
  methodScrollView: {
    marginTop: responsiveHeight(8),
  },
  methodButton: {
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(8),
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginRight: responsiveWidth(8),
  },
  methodButtonActive: {
    backgroundColor: "#fce7f3",
    borderColor: "#ff6b9d",
  },
  methodButtonText: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(13),
    color: "#6b7280",
  },
  methodButtonTextActive: {
    color: "#ff6b9d",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: responsiveHeight(16),
  },
  checkboxLabel: {
    fontFamily: "Montserrat-Medium",
    fontSize: responsiveFont(14),
    color: "#1f2937",
    flex: 1,
    marginLeft: responsiveWidth(8),
  },
  checkboxHint: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#6b7280",
    marginTop: responsiveHeight(4),
    marginLeft: responsiveWidth(32),
  },
  giftInfoCard: {
    flexDirection: "row",
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 3,
    borderLeftColor: "#3b82f6",
    padding: responsiveWidth(12),
    borderRadius: responsiveWidth(8),
    marginTop: responsiveHeight(12),
  },
  giftInfoText: {
    fontFamily: "Montserrat-Regular",
    fontSize: responsiveFont(12),
    color: "#1e40af",
    flex: 1,
    marginLeft: responsiveWidth(8),
    lineHeight: responsiveHeight(18),
  },
});

export default GuestManagementScreen;
