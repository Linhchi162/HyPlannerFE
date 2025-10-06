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
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import WeddingDressMenu from '../components/WeddingDressMenu';
import WeddingItemCard from '../components/WeddingItemCard';
import { fonts } from '../theme/fonts';
import * as weddingCostumeService from '../service/weddingCostumeService';
import { Neckline } from '../store/weddingCostume';
import { useSelection } from '../contexts/SelectionContext';

const { width } = Dimensions.get('window');

const WeddingNecklineScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [menuVisible, setMenuVisible] = useState(false);
  const [necklines, setNecklines] = useState<Neckline[]>([]);
  const { selectedNecklines, toggleNecklineSelection } = useSelection();

  useEffect(() => {
    weddingCostumeService.getAllNecklines()
      .then(response => {
        setNecklines(response.data);
      })
      .catch(error => {});
  }, []);

  const renderNecklineItem = (item: Neckline) => {
    return (
      <WeddingItemCard
        key={item._id}
        id={item._id}
        name={item.name}
        image={item.image}
        isSelected={selectedNecklines.includes(item._id)}
        onSelect={async () => await toggleNecklineSelection(item._id)}
      />
    );
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
          <Text style={styles.headerTitle}>Váy cưới</Text>
          <Text style={styles.headerSubtitle}>Cổ áo</Text>
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
        currentScreen="WeddingNeckline"
        onClose={() => setMenuVisible(false)}
      />

      {/* Neckline Grid */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.dressGrid}>
          {necklines.map(renderNecklineItem)}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('WeddingDetail')}
        >
          <Text style={styles.actionButtonText}>Chọn chi tiết</Text>
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
    gap: 8,
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

export default WeddingNecklineScreen;