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
import WeddingDressMenu from '../components/WeddingDressMenu';
import WeddingItemCard from '../components/WeddingItemCard';
import { fonts } from '../theme/fonts';
import * as weddingCostumeService from '../service/weddingCostumeService';
import { Style } from '../store/weddingCostume';
import { useSelection } from '../contexts/SelectionContext';
import { getGridGap } from '../../assets/styles/utils/responsive';

const { width } = Dimensions.get('window');

const WeddingDressScreen = () => {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dressStyles, setDressStyles] = useState<Style[]>([]);
  const { selectedStyles, toggleStyleSelection } = useSelection();

  useEffect(() => {
    weddingCostumeService.getAllStyles()
      .then(response => {
        setDressStyles(response.data);
      })
      .catch(error => {});
  }, []);

  const renderDressItem = (item: Style) => {
    return (
      <WeddingItemCard
        key={item._id}
        id={item._id}
        name={item.name}
        image={item.image}
        isSelected={selectedStyles.includes(item._id)}
        onSelect={async () => await toggleStyleSelection(item._id)}
      />
    );
  };

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('ChooseStyle' as never)}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Váy cưới</Text>
          <Text style={styles.headerSubtitle}>Kiểu dáng</Text>
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
      <WeddingDressMenu 
        visible={menuVisible}
        currentScreen="WeddingDress"
        onClose={() => setMenuVisible(false)}
      />

      {/* Dress Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.dressGrid}>
          {dressStyles.map(renderDressItem)}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Accessories' as never)}
        >
          <Text style={styles.actionButtonText}>Chọn phụ kiện</Text>
          <ChevronLeft size={16} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
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
  dressGrid: {
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

export default WeddingDressScreen;