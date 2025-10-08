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
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import LocationCard from '../components/LocationCard';
import * as venueThemeService from '../service/venueThemeService';
import * as userSelectionService from '../service/userSelectionService';
import CustomPopup from '../components/CustomPopup';

const { width } = Dimensions.get('window');

interface OptionItem {
  id: string;
  name: string;
  image: string;
}

const StyleScreen = () => {
  const navigation = useNavigation();
  const [selected, setSelected] = useState<string[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('warning');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupButtonText, setPopupButtonText] = useState<string | undefined>(undefined);
  const [onPopupButtonPress, setOnPopupButtonPress] = useState<(() => void) | undefined>(undefined);

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  const [options, setOptions] = useState<OptionItem[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await venueThemeService.getWeddingThemes();
        setOptions(res.data.map((v) => ({ id: v._id, name: v.name, image: v.image })));
      } catch {}
    })();
  }, []);

  const toggleSelection = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phong cách</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Hãy chọn phong cách bạn mong muốn !</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {options.map(item => (
            <LocationCard
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image}
              isSelected={selected.includes(item.id)}
              onSelect={() => toggleSelection(item.id)}
            />
          ))}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, selected.length === 0 && styles.actionButtonDisabled]}
          onPress={async () => {
            if (selected.length === 0) return;
            try {
              setPopupType('warning');
              setPopupTitle('Đang tạo');
              setPopupMessage('Vui lòng đợi trong giây lát...');
              setPopupButtonText(undefined);
              setOnPopupButtonPress(undefined);
              setPopupVisible(true);
              await userSelectionService.createSelection({ weddingThemeIds: Array.from(new Set(selected)) }, 'wedding-theme');
              const albums = await userSelectionService.getUserAlbums();
              const name = `Album ${Array.isArray(albums.data) ? albums.data.length + 1 : 1}`;
              await userSelectionService.createAlbum({ name, type: 'wedding-theme' as any });
              setPopupType('success');
              setPopupTitle('Thành công');
              setPopupMessage('Đã tạo album phong cách thành công.');
              setPopupButtonText('Xem album');
              setOnPopupButtonPress(() => () => {
                // @ts-ignore
                navigation.navigate('Album');
              });
            } catch (e: any) {
              setPopupType('error');
              setPopupTitle('Thất bại');
              const msg = e?.message || e?.data?.message || 'Không thể tạo album phong cách.';
              setPopupMessage(msg);
              setPopupButtonText('Đóng');
              setOnPopupButtonPress(undefined);
            }
          }}
          disabled={selected.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.actionButtonText}>Hoàn thành</Text>
        </TouchableOpacity>
      </ScrollView>
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
  scrollContent: { paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, justifyContent: 'space-between' },
  actionButton: {
    backgroundColor: '#F9CBD6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginTop: 12,
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
});

export default StyleScreen;


