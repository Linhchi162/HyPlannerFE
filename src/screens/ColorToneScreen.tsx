import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LocationCard from '../components/LocationCard';
import * as toneService from '../service/toneService';
import type { ToneColorItem } from '../service/toneService';
import apiClient from '../api/client';
import * as userSelectionService from '../service/userSelectionService';
import { useSelection } from '../contexts/SelectionContext';
import CustomPopup from '../components/CustomPopup';

const { width } = Dimensions.get('window');

interface OptionItem {
  id: string;
  name: string;
  image: string;
}

type ToneType = 'wedding' | 'engagement';

const ColorToneScreen = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>([]);
  const [toneType, setToneType] = useState<ToneType>('wedding');
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<ToneColorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('warning');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupButtonText, setPopupButtonText] = useState<string | undefined>(undefined);
  const [onPopupButtonPress, setOnPopupButtonPress] = useState<(() => void) | undefined>(undefined);

  const { toggleWeddingToneColor, toggleEngageToneColor, selectedWeddingToneColors, selectedEngageToneColors, clearSelections } = useSelection();

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  const fetchData = async (type: ToneType) => {
    try {
      setLoading(true);
      const res = type === 'wedding'
        ? await toneService.getWeddingToneColors()
        : await toneService.getEngageToneColors();
      setItems(res.data || []);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchData(toneType);
  }, [toneType]);

  const handleCreateAlbum = async () => {
    const totalSelected = selectedWeddingToneColors.length + selectedEngageToneColors.length;
    if (totalSelected === 0) return;
    try {
      setIsCreatingAlbum(true);
      setPopupType('warning');
      setPopupTitle('Đang tạo');
      setPopupMessage('Vui lòng đợi trong giây lát...');
      setPopupButtonText(undefined);
      setOnPopupButtonPress(undefined);
      setPopupVisible(true);
      // Luôn gửi cả hai mảng để giữ được lựa chọn từ cả hai tab
      await userSelectionService.createSelection({
        weddingToneColorIds: Array.from(new Set(selectedWeddingToneColors)),
        engageToneColorIds: Array.from(new Set(selectedEngageToneColors)),
      }, 'tone-color');

      // Lấy số album hiện có để đặt tên tiếp theo
      let albumCount = 0;
      try {
        const res = await userSelectionService.getUserAlbums();
        albumCount = Array.isArray(res.data) ? res.data.length : 0;
      } catch {}

      const albumName = `Album ${albumCount + 1}`;
      await userSelectionService.createAlbum({ name: albumName, type: 'tone-color' });
      // Clear local and context selections to avoid carrying over to next album
      setSelected([]);
      clearSelections();
      setPopupType('success');
      setPopupTitle('Thành công');
      setPopupMessage('Đã tạo album tone màu thành công.');
      setPopupButtonText('Xem album');
      setOnPopupButtonPress(() => () => {
        // @ts-ignore
        navigation.navigate('Album');
      });
    } catch (e: any) {
      const msg = e?.message || e?.data?.message || 'Không thể tạo album';
      setPopupType('error');
      setPopupTitle('Thất bại');
      setPopupMessage(msg);
      setPopupButtonText('Đóng');
      setOnPopupButtonPress(undefined);
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    if (toneType === 'wedding') {
      void toggleWeddingToneColor(id);
    } else {
      void toggleEngageToneColor(id);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tone màu</Text>
        <TouchableOpacity
          onPress={() => {
            if (!menuVisible) {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            }
            setMenuVisible(!menuVisible);
          }}
        >
          <Menu size={22} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Dropdown menu under header */}
      {menuVisible && (
        <View style={styles.menuWrapper}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuItem, toneType === 'wedding' && styles.menuItemActive]}
              onPress={() => { setToneType('wedding'); setMenuVisible(false); }}
            >
              <Text style={[styles.menuText, toneType === 'wedding' && styles.menuTextActive]}>Đám cưới</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, toneType === 'engagement' && styles.menuItemActive]}
              onPress={() => { setToneType('engagement'); setMenuVisible(false); }}
            >
              <Text style={[styles.menuText, toneType === 'engagement' && styles.menuTextActive]}>Lễ ăn hỏi</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Hãy chọn tone màu bạn mong muốn !</Text>
      </View>

      <FlatList
        data={loading ? [] : items}
        keyExtractor={(item) => (item as any)._id || (item as any).id}
        numColumns={2}
        renderItem={({ item }) => {
          const itemId = (item as any)._id || (item as any).id;
          return (
            <LocationCard
              id={itemId}
              name={(item as any).name}
              image={(item as any).image}
              isSelected={selected.includes(itemId)}
              onSelect={() => toggleSelection(itemId)}
            />
          );
        }}
        contentContainerStyle={styles.scrollContent}
        columnWrapperStyle={styles.columnWrapper}
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{ paddingTop: 8, paddingBottom: 24 }}>
            <TouchableOpacity
              style={[styles.actionButton, selected.length === 0 && styles.actionButtonDisabled]}
              onPress={handleCreateAlbum}
              disabled={isCreatingAlbum || selected.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.actionButtonText}>{isCreatingAlbum ? 'Đang tạo...' : 'Hoàn thành'}</Text>
            </TouchableOpacity>
          </View>
        }
      />
      <CustomPopup
        visible={popupVisible}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        buttonText={popupButtonText}
        onButtonPress={onPopupButtonPress}
        onClose={() => setPopupVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#1f2937' },
  instructionContainer: { paddingHorizontal: 16, paddingVertical: 16 },
  instructionText: { fontSize: 16, fontWeight: '500', color: '#6b7280', textAlign: 'center' },
  menuWrapper: { position: 'absolute', top: 64 + (Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0), right: 16, zIndex: 1000 },
  menuContainer: { backgroundColor: '#FEF0F3', width: 180, borderRadius: 12, padding: 8, gap: 6 },
  menuItem: { backgroundColor: '#FEE5EE', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  menuItemActive: { backgroundColor: '#FFD4E3' },
  menuText: { color: '#1f2937', textAlign: 'center', fontWeight: '500' },
  menuTextActive: { fontWeight: '700' },
  scrollContent: { paddingBottom: 24, paddingHorizontal: 16 },
  columnWrapper: { justifyContent: 'space-between', gap: 8, paddingTop: 16 },
  actionButton: {
    backgroundColor: '#F9CBD6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  footerActionWrapper: {},
});

export default ColorToneScreen;


