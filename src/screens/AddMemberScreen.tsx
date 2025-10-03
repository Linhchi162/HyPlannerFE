import React, { memo, useState, useCallback, useMemo, useEffect } from 'react'
import {
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    Platform,
    FlatList,
} from 'react-native'
import {
    Appbar,
    Searchbar,
    List,
    Avatar,
    IconButton,
    Button,
    Icon,
} from 'react-native-paper'
import { Entypo } from '@expo/vector-icons'
import { NavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../navigation/AppNavigator'
import { responsiveFont, responsiveHeight, responsiveWidth } from '../../assets/styles/utils/responsive'
import { useSelector } from 'react-redux'
import { RootState } from '../store'
import { Member } from '../store/weddingEventSlice'

// --- Component Appbar ---
type AddMemberAppbarProps = {
    onBack: () => void
}
const AddMemberAppbar = memo(({ onBack }: AddMemberAppbarProps) => (
    <Appbar.Header style={styles.appbarHeader}>
        <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
            <Entypo name="chevron-left" size={24} color="#000000" />
        </TouchableOpacity>
        <Appbar.Content
            title="Thêm thành viên đảm nhận"
            titleStyle={styles.appbarTitle}
        />
    </Appbar.Header>
))


export default function AddMemberScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<RootStackParamList, "AddMember">>();
    const recentMembers = useSelector((state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent.member) || [];
    const existingMembers = route.params?.existingMembers || [];
    const onSelect = route.params?.onSelect;
    useEffect(() => {
        setSelectedMembers(existingMembers);
    }, [existingMembers]);

    const availableMembers = useMemo(() => {
        return recentMembers.filter((eventMember) => !existingMembers.some((taskMember) => taskMember._id === eventMember._id));
    }, [recentMembers, existingMembers]);

    const handleSelectMember = useCallback((member: Member) => {
        if (!selectedMembers.find((m) => m._id === member._id)) {
            setSelectedMembers((prev) => [...prev, member]);
        }
    }, [selectedMembers]);

    //   const handleDeselectMember = useCallback((memberId: string) => {
    //     setSelectedMembers((prev) => prev.filter((m) => m._id !== memberId));
    //   }, []);
    const handleDeselectMember = useCallback((memberId: string) => {
        setSelectedMembers((prev) => prev.filter((m) => m._id !== memberId));
    }, []);

    const filteredMembers = useMemo(() => {
        if (!searchQuery) {
            return availableMembers;
        }
        const lowercasedQuery = searchQuery.toLowerCase();
        return availableMembers.filter(
            (member) =>
                member.fullName.toLowerCase().includes(lowercasedQuery) ||
                member.email.toLowerCase().includes(lowercasedQuery)
        );
    }, [searchQuery, availableMembers]);

    const renderMemberItem = ({ item }: { item: Member }) => {
        const isSelected = selectedMembers.some((m) => m._id === item._id);
        return (
            <List.Item
                style={{ paddingRight: 0 }}
                title={item.fullName}
                description={item.email}
                titleStyle={styles.memberTitle}
                descriptionStyle={styles.memberDescription}
                left={() => <Avatar.Image size={46} source={{ uri: item.picture }} />}
                right={() => (
                    <IconButton
                        icon="plus"
                        iconColor={isSelected ? "#AAAAAA" : "#D95D74"}
                        size={24}
                        onPress={() => handleSelectMember(item)}
                        disabled={isSelected}
                    />
                )}
            />
        );
    };

    return (
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <AddMemberAppbar onBack={() => navigation.goBack()} />
            <View style={styles.contentContainer}>
                <Searchbar
                    placeholder="Tìm người dùng..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchBar}
                    placeholderTextColor="#ADAEBC"
                    inputStyle={styles.searchBarInput}
                    iconColor="#ADAEBC"
                    theme={{
                        colors: {
                            primary: "#D95D74",
                            onSurfaceVariant: "#AAAAAA",
                        },
                    }}
                />

                <Text style={styles.listTitle}>
                    Chọn thành viên {selectedMembers.length > 0 ? `(${selectedMembers.length})` : ""}
                </Text>
                {selectedMembers.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Icon source="account-group-outline" color="#9CA3AF" size={37} />
                        <Text style={styles.emptyText}>Chưa có thành viên nào được chọn</Text>
                    </View>
                ) : (
                    <View style={styles.selectedContainer}>
                        <FlatList
                            data={selectedMembers}
                            keyExtractor={(item) => item._id}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <View style={styles.avatarWrapper}>
                                    <Avatar.Image size={48} source={{ uri: item.picture }} />
                                    <TouchableOpacity
                                        style={styles.removeIcon}
                                        onPress={() => handleDeselectMember(item._id)}
                                    >
                                        <Icon source="close-circle" size={20} color="#D95D74" />
                                    </TouchableOpacity>
                                </View>
                            )}
                        />
                    </View>
                )}

                <Text style={styles.listTitle}>Thành viên gần nhất</Text>
                <FlatList
                    data={filteredMembers}
                    renderItem={renderMemberItem}
                    ListEmptyComponent={<View style={{
                        flex: 1,
                        minHeight: responsiveHeight(350),
                        justifyContent: "center",
                        alignItems: "center"
                    }}>
                        <Text style={{ textAlign: "center" }}>
                            Chưa có thành viên nào.{"\n"}Bạn hãy mời thêm thành viên nhé.
                        </Text>
                    </View>}
                    keyExtractor={(item) => item._id}
                    style={styles.flatList}
                />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={() => {
                        if (onSelect) onSelect(selectedMembers);
                        navigation.goBack();
                    }}
                    disabled={selectedMembers.length === 0}
                    style={[
                        styles.confirmButton,
                        {
                            backgroundColor: "#F9E2E7",
                            opacity: selectedMembers.length === 0 ? 0.6 : 1,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.confirmButtonLabel,
                            {
                                color: selectedMembers.length > 0 ? "#9E182B" : "#AAAAAA",
                                textAlign: "center",
                            },
                        ]}
                    >
                        {selectedMembers.length === 0 ? "Chọn thành viên để tiếp tục" : "Tiếp tục"}
                    </Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
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
        marginRight: responsiveWidth(30),
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: responsiveWidth(14),
    },
    searchBar: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F9E2E7',
        marginVertical: responsiveWidth(14),
        elevation: 0,
    },
    searchBarInput: {
        fontFamily: 'Montserrat-Regular',
        color: '#000000',
    },
    listTitle: {
        fontSize: responsiveFont(13),
        fontWeight: '700',
        color: '#4B5563',
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: responsiveHeight(12),
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveHeight(34),
        backgroundColor: '#FFF8F9',
        borderRadius: 12,
    },
    emptyText: {
        fontSize: responsiveFont(13),
        fontWeight: '400',
        color: '#9CA3AF',
        fontFamily: 'Montserrat-Regular',
        marginTop: responsiveHeight(10),
    },
    selectedContainer: {
        minHeight: responsiveHeight(80),
        marginBottom: responsiveHeight(16),
    },
    avatarWrapper: {
        marginRight: responsiveWidth(10),
        alignSelf: "center",
        position: 'relative',
    },
    removeIcon: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'white',
        borderRadius: 10,
    },
    flatList: {
        flex: 1,
    },
    memberTitle: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: responsiveFont(13),
        color: '#333333',
    },
    memberDescription: {
        fontFamily: 'Montserrat-Regular',
        fontSize: responsiveFont(11),
        color: '#6B7280',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#F9E2E7',
    },
    confirmButton: {
        paddingVertical: responsiveHeight(12),
        borderRadius: 12,
    },
    confirmButtonLabel: {
        fontSize: responsiveFont(14),
        fontWeight: '600',
    },
})
