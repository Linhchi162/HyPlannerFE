import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import WeddingItemCard from '../components/WeddingItemCard';
import * as groomEngageService from '../service/groomEngageService';
import { Style } from '../store/weddingCostume';
import EngagementGroomMenu from '../components/EngagementGroomMenu';
import { getGridGap } from '../../assets/styles/utils/responsive';
import { useSelection } from '../contexts/SelectionContext';

export default function GroomEngagementOutfitScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<Style[]>([]);
  const { selectedGroomEngageOutfits, toggleGroomEngageOutfit, saveSelections } = useSelection();
  useEffect(() => { 
    groomEngageService.getAllGroomEngageOutfits()
      .then(r => setItems(r.data))
      .catch(error => {});
  }, []);

  const renderDressItem = (item: Style) => {
    return (
      <WeddingItemCard
        key={item._id}
        id={item._id}
        name={item.name}
        image={item.image}
        isSelected={selectedGroomEngageOutfits.includes(item._id)}
        onSelect={async () => await toggleGroomEngageOutfit(item._id)}
      />
    );
  };
  
  
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;
  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>Lễ ăn hỏi</Text><Text style={styles.headerSubtitle}>Trang phục</Text></View>
        <TouchableOpacity onPress={() => {
          if (!menuVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          setMenuVisible(!menuVisible);
        }}><Menu size={24} color="#1f2937" /></TouchableOpacity>
      </View>
      <EngagementGroomMenu visible={menuVisible} currentScreen="GroomEngagementOutfit" onClose={()=>setMenuVisible(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.dressGrid}>
          {items.map(renderDressItem)}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={async () => {
          await saveSelections();
          navigation.navigate('GroomEngagementAccessories' as never);
        }}>
          <Text style={styles.actionButtonText}>Chọn phụ kiện</Text>
          <ChevronLeft size={16} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, height:64, backgroundColor:'#FEF0F3' },
  headerTitleContainer: { alignItems:'center' },
  headerTitle: { fontSize:20, fontFamily:fonts.montserratSemiBold, color:'#1f2937' },
  headerSubtitle: { fontSize:14, fontFamily:fonts.montserratMedium, color:'#6b7280', marginTop:2 },
  scrollContent: { paddingBottom:24 },
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
  actionButtonDisabled: { backgroundColor:'#E5E7EB', opacity:0.6 },
});


