import React, { use, useEffect, useState } from 'react'
import { StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { Appbar, Dialog, Portal, Button, ActivityIndicator } from 'react-native-paper';
import { Entypo, MaterialIcons } from '@expo/vector-icons';
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import EditPhaseModal from './EditPhaseModal';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { responsiveFont, responsiveHeight, responsiveWidth } from 'assets/styles/utils/responsive';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { deletePhase, getPhases, updatePhase } from 'src/service/phaseService';

interface Phase {
    _id: string;
    phaseTimeStart: string;
    phaseTimeEnd: string;
}

interface EditPhaseAppBarProps {
    onBack?: () => void;
}

const EditPhaseAppBar = ({ onBack }: EditPhaseAppBarProps) => {
    return (
        <Appbar.Header style={styles.appbarHeader}>
            <TouchableOpacity onPress={onBack} style={{ padding: 8, marginRight: 8 }}>
                <Entypo name="chevron-left" size={24} color="#000000" />
            </TouchableOpacity>
            <Appbar.Content
                title="Chỉnh sửa giai đoạn"
                titleStyle={styles.appbarTitle}
            />
        </Appbar.Header>
    );
}

function EditPhaseScreen() {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedPhase, setSelectedPhase] = useState<Phase | null>(null);
    const [editStartDate, setEditStartDate] = useState('');
    const [editEndDate, setEditEndDate] = useState('');
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [phaseToDelete, setPhaseToDelete] = useState<string | null>(null);

    // take data from redux
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(false);
    const route = useRoute<RouteProp<RootStackParamList, "EditPhaseScreen">>();
    const dispatch = useDispatch<AppDispatch>();

    // task from params
    // const phasesData = route.params.phases;
    const eventId = route.params.eventId;
    const createdAt = route.params.createdAt;
    const createdAtDate = createdAt ? new Date(createdAt) : new Date();
    const phasesData = useSelector((state: RootState) => state.phases.getPhases.phases);
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
        index
    }));

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
        });
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
                console.error(error);
            }
            setDeleteDialogVisible(false);
            setPhaseToDelete(null);
        }
    };

    const cancelDelete = () => {
        setDeleteDialogVisible(false);
        setPhaseToDelete(null);
    };

    const handleSaveEdit = async () => {
        if (selectedPhase && eventId) {
            try {
                setLoading(true);
                // Chuyển đổi ngày về ISO string nếu cần
                const [startDay, startMonth, startYear] = editStartDate.split('/');
                const [endDay, endMonth, endYear] = editEndDate.split('/');

                const phaseTimeStart = new Date(Date.UTC(
                    2000 + Number(startYear), // hoặc Number('20' + startYear) nếu startYear là 2 số
                    Number(startMonth) - 1,
                    Number(startDay)
                )).toISOString();

                const phaseTimeEnd = new Date(Date.UTC(
                    2000 + Number(endYear),
                    Number(endMonth) - 1,
                    Number(endDay)
                )).toISOString();

                await updatePhase(selectedPhase._id, { phaseTimeStart, phaseTimeEnd }, dispatch);
                await getPhases(eventId, dispatch); // Lấy lại danh sách phase mới nhất
                setLoading(false);
            } catch (error) {
                // Có thể show thông báo lỗi ở đây
                alert('Có lỗi xảy ra khi cập nhật giai đoạn.');
                console.error(error);
            }
            setModalVisible(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => {

        return (
            <View style={styles.rowFront}>
                <View style={styles.phaseCard}>
                    <Text style={styles.phaseTitle}>
                        Giai đoạn {item.index + 1}: {formatDate(item.phaseTimeStart)} - {formatDate(item.phaseTimeEnd)}
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
    const formatShortDate = (date: Date) => {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear().toString().slice(-2);
        return `${day}/${month}/${year}`;
    };
    return (
        <View style={styles.safeArea}>
            <EditPhaseAppBar onBack={() => navigation.goBack()} />
            {loading ?
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#D95D74" />
                </View> : (
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
                            projectStartDate={createdAt ? formatShortDate(createdAtDate) : ''}
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
                    <Dialog.Title style={styles.dialogTitle}>
                        Xác nhận xóa
                    </Dialog.Title>
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
            </Portal>
        </View>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    appbarHeader: {
        backgroundColor: '#FEF0F3',
        elevation: 0,
        shadowOpacity: 0,
    },
    appbarTitle: {
        color: '#333',
        fontFamily: 'Montserrat-SemiBold',
        fontSize: responsiveFont(16),
        fontWeight: '700',
        textAlign: 'center',
        marginRight: responsiveWidth(30),
    },
    listContainer: {
        padding: responsiveWidth(13),
    },
    rowFront: {
        backgroundColor: 'transparent',
    },
    phaseCard: {
        backgroundColor: '#F9F9F9',
        borderRadius: 7,
        padding: responsiveWidth(15),
        marginBottom: responsiveHeight(12),
        borderLeftWidth: 4,
        borderLeftColor: '#D95D74',
    },
    phaseTitle: {
        fontSize: responsiveFont(13),
        fontWeight: '600',
        color: '#333',
    },
    rowBack: {
        alignItems: 'center',
        backgroundColor: 'transparent',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: responsiveHeight(13),
        borderRadius: 12,
    },
    backRightBtn: {
        alignItems: 'center',
        bottom: 0,
        justifyContent: 'center',
        position: 'absolute',
        top: 0,
        width: 75,
    },
    backRightBtnLeft: {
        backgroundColor: '#EEB5C1',
        right: 75,
        borderTopLeftRadius: 7,
        borderBottomLeftRadius: 7,
    },
    backRightBtnRight: {
        backgroundColor: '#E38EA0',
        right: 0,
        borderTopRightRadius: 7,
        borderBottomRightRadius: 7,
    },
    backTextWhite: {
        color: '#FFF',
        fontSize: responsiveFont(10),
        fontFamily: 'Montserrat-SemiBold',
    },
    dialog: {
        backgroundColor: 'white',
        borderRadius: 12,
    },
    dialogTitle: {
        color: '#333',
        fontSize: responsiveFont(14),
        fontWeight: '600',
        fontFamily: 'Montserrat-SemiBold',
    },
    dialogContent: {
        color: '#666',
        fontSize: responsiveFont(14),
        lineHeight: responsiveHeight(24),
        fontFamily: 'Montserrat-Regular',
    },
    dialogActions: {
        paddingHorizontal: 8,
        paddingBottom: 8,
    },
    cancelButton: {
        marginRight: 8,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
    },
    deleteButton: {
        borderRadius: 8,
        paddingHorizontal: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default EditPhaseScreen