import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import WeddingItemCard from '../components/WeddingItemCard';
import { fonts } from '../theme/fonts';
import * as weddingCostumeService from '../service/weddingCostumeService';
import { Style } from '../store/weddingCostume';
import { useSelection } from '../contexts/SelectionContext';
import { getGridGap } from '../../assets/styles/utils/responsive';
import CustomPopup from '../components/CustomPopup';

const { width } = Dimensions.get('window');

const WeddingFlowersScreen = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flowers, setFlowers] = useState<Style[]>([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const { selectedFlowers, toggleFlowerSelection, createAlbum } = useSelection();

  useEffect(() => {
    const fetchFlowers = async () => {
      setIsLoading(true);
      try {
        const response = await weddingCostumeService.getAllFlowers();
        setFlowers(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu hoa cưới');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlowers();
  }, []);

  const renderFlowerItem = (item: Style) => {
    return (
      <WeddingItemCard
        key={item._id}
        id={item._id}
        name={item.name}
        image={item.image}
        isSelected={selectedFlowers.includes(item._id)}
        onSelect={async () => await toggleFlowerSelection(item._id)}
      />
    );
  };

  const handleCreateAlbum = async () => {
    setIsCreatingAlbum(true);
    try {
      await createAlbum('wedding-dress');
      setPopupType('success');
      setPopupTitle('Thành công');
      setPopupMessage('Album đã được tạo thành công!');
      setPopupVisible(true);
    } catch (error: any) {
      setPopupType('error');
      setPopupTitle('Lỗi');
      setPopupMessage(error.message || 'Có lỗi xảy ra khi tạo album');
      setPopupVisible(true);
    } finally {
      setIsCreatingAlbum(false);
    }
  };

  const handlePopupClose = () => {
    setPopupVisible(false);
    if (popupType === 'success') {
      navigation.navigate('Album' as never);
    }
  };

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Hoa cưới</Text>
          <Text style={styles.headerSubtitle}>Kiểu dáng</Text>
        </View>
        <TouchableOpacity>
          <Menu size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>

      {/* Flowers Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text>Đang tải dữ liệu...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.flowerGrid}>
            {flowers.map(renderFlowerItem)}
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionButton, isCreatingAlbum && styles.actionButtonDisabled]}
          onPress={handleCreateAlbum}
          disabled={isCreatingAlbum}
        >
          <Text style={styles.actionButtonText}>
            {isCreatingAlbum ? 'Đang tạo album...' : 'Hoàn thành'}
          </Text>
          <ChevronLeft size={16} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Popup */}
      <CustomPopup
        visible={popupVisible}
        type={popupType}
        title={popupTitle}
        message={popupMessage}
        onClose={handlePopupClose}
        buttonText="OK"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontFamily: fonts.montserratMedium,
  },
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
    backgroundColor: '#FEF0F3',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: fonts.montserratSemiBold,
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: fonts.montserratMedium,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  flowerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: getGridGap(),
  },
  actionButton: {
    backgroundColor: '#F9CBD6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 100,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  actionButtonText: {
    color: '#000000',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: fonts.montserratSemiBold,
    marginRight: 4,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});

export default WeddingFlowersScreen;
