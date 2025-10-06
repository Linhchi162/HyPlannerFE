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
import { LayoutAnimation } from 'react-native';
import { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import AccessoriesMenu from '../components/AccessoriesMenu';
import WeddingItemCard from '../components/WeddingItemCard';
import { fonts } from '../theme/fonts';
import * as weddingCostumeService from '../service/weddingCostumeService';
import { Style } from '../store/weddingCostume';
import { useSelection } from '../contexts/SelectionContext';
import { getGridGap } from '../../assets/styles/utils/responsive';

const { width } = Dimensions.get('window');

const AccessoriesJewelryScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jewelry, setJewelry] = useState<Style[]>([]);
  const { selectedJewelry, toggleJewelrySelection } = useSelection();

  useEffect(() => {
    const fetchJewelry = async () => {
      setIsLoading(true);
      try {
        const response = await weddingCostumeService.getAllJewelry();
        setJewelry(response.data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJewelry();
  }, []);

  const renderJewelryItem = (item: Style) => {
    return (
      <WeddingItemCard
        key={item._id}
        id={item._id}
        name={item.name}
        image={item.image}
        isSelected={selectedJewelry.includes(item._id)}
        onSelect={async () => await toggleJewelrySelection(item._id)}
      />
    );
  };

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Phụ kiện</Text>
          <Text style={styles.headerSubtitle}>Trang sức</Text>
        </View>
        <TouchableOpacity onPress={() => {
          if (!menuVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          setMenuVisible(!menuVisible);
        }}>
          <Menu size={24} color="#1f2937" />
        </TouchableOpacity>
      </View>
      <AccessoriesMenu 
        visible={menuVisible}
        currentScreen="AccessoriesJewelry"
        onClose={() => setMenuVisible(false)}
      />

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
          <View style={styles.jewelryGrid}>
            {jewelry.map(renderJewelryItem)}
          </View>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('WeddingFlowers' as never)}
        >
          <Text style={styles.actionButtonText}>Chọn hoa cưới</Text>
          <ChevronLeft size={16} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
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
  jewelryGrid: {
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
});

export default AccessoriesJewelryScreen;
