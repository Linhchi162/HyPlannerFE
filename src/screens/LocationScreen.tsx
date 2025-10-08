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
  Image,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import LocationCard from '../components/LocationCard';
import * as venueThemeService from '../service/venueThemeService';
import * as userSelectionService from '../service/userSelectionService';
import CustomPopup from '../components/CustomPopup';

const { width } = Dimensions.get('window');

interface LocationOption {
  id: string;
  name: string;
  image: string;
}

const LocationScreen = () => {
  const navigation = useNavigation();
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('warning');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const [popupButtonText, setPopupButtonText] = useState<string | undefined>(undefined);
  const [onPopupButtonPress, setOnPopupButtonPress] = useState<(() => void) | undefined>(undefined);

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await venueThemeService.getWeddingVenues();
        setLocationOptions(res.data.map((v) => ({ id: v._id, name: v.name, image: v.image })));
      } catch {}
    })();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedLocations(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getItemWidth = () => {
    const paddingHorizontal = 32; // 16px on each side
    const gap = 8;
    const availableWidth = width - paddingHorizontal;
    const totalGapWidth = gap; // 1 gap between 2 items
    return (availableWidth - totalGapWidth) / 2;
  };

  const getItemHeight = () => {
    return getItemWidth(); // Square aspect ratio
  };

  const renderLocationItem = (item: LocationOption) => {
    const isSelected = selectedLocations.includes(item.id);
    
    return (
      <LocationCard
        key={item.id}
        id={item.id}
        name={item.name}
        image={item.image}
        isSelected={isSelected}
        onSelect={() => toggleSelection(item.id)}
      />
    );
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa điểm</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Instruction Text */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>Hãy chọn địa điểm bạn mong muốn !</Text>
      </View>

      {/* Location Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.locationGrid}>
          {locationOptions.map(renderLocationItem)}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.actionButton, selectedLocations.length === 0 && styles.actionButtonDisabled]}
          onPress={async () => {
            if (selectedLocations.length === 0) return;
            try {
              setPopupType('warning');
              setPopupTitle('Đang tạo');
              setPopupMessage('Vui lòng đợi trong giây lát...');
              setPopupButtonText(undefined);
              setOnPopupButtonPress(undefined);
              setPopupVisible(true);
              await userSelectionService.createSelection({ weddingVenueIds: Array.from(new Set(selectedLocations)) }, 'wedding-venue');
              // Tạo album từ selection pinned
              const albums = await userSelectionService.getUserAlbums();
              const name = `Album ${Array.isArray(albums.data) ? albums.data.length + 1 : 1}`;
              await userSelectionService.createAlbum({ name, type: 'wedding-venue' as any });
              setPopupType('success');
              setPopupTitle('Thành công');
              setPopupMessage('Đã tạo album địa điểm thành công.');
              setPopupButtonText('Xem album');
              setOnPopupButtonPress(() => () => {
                // @ts-ignore
                navigation.navigate('Album');
              });
            } catch (e: any) {
              setPopupType('error');
              setPopupTitle('Thất bại');
              const msg = e?.message || e?.data?.message || 'Không thể tạo album địa điểm.';
              setPopupMessage(msg);
              setPopupButtonText('Đóng');
              setOnPopupButtonPress(undefined);
            }
          }}
          disabled={selectedLocations.length === 0}
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 64,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  instructionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  instructionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    justifyContent: 'space-between',
  },
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

export default LocationScreen;
