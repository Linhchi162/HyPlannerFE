import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import WeddingItemCard from '../components/WeddingItemCard';
import * as brideEngageService from '../service/brideEngageService';
import { Style } from '../store/weddingCostume';
import { getGridGap } from '../../assets/styles/utils/responsive';
import { useSelection } from '../contexts/SelectionContext';
import CustomPopup from '../components/CustomPopup';

export default function BrideHeadscarfScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState<Style[]>([]);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | 'warning'>('success');
  const [popupTitle, setPopupTitle] = useState('');
  const [popupMessage, setPopupMessage] = useState('');
  const { 
    selectedBrideEngageStyles, 
    selectedBrideEngageMaterials, 
    selectedBrideEngagePatterns, 
    selectedBrideEngageHeadwears, 
    toggleBrideEngageHeadwear, 
    createAlbum, 
    saveSelections 
  } = useSelection();
  
  useEffect(() => { brideEngageService.getAllBrideEngageHeadwears().then(r=>setItems(r.data)); }, []);
  
  const handleCreateAlbum = async () => {
    setIsCreatingAlbum(true);
    try {
      
      // Force save all selections before creating album
      await saveSelections();
      
      // Wait a bit for API to process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await createAlbum('bride-engage');
      setPopupType('success');
      setPopupTitle('Thành công');
      setPopupMessage('Album đã được tạo thành công!');
      setPopupVisible(true);
    } catch (error: any) {
      console.log('Error creating album:', error);
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
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>Áo dài</Text><Text style={styles.headerSubtitle}>Khăn đội đầu</Text></View>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {items.map(it => (
            <WeddingItemCard key={it._id} id={it._id} name={it.name} image={it.image} isSelected={selectedBrideEngageHeadwears.includes(it._id)} onSelect={()=>toggleBrideEngageHeadwear(it._id)} />
          ))}
        </View>
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
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },
  header: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, height:64, backgroundColor:'#FEF0F3' },
  headerTitleContainer: { alignItems:'center' },
  headerTitle: { fontSize:20, fontFamily:fonts.montserratSemiBold, color:'#1f2937' },
  headerSubtitle: { fontSize:14, fontFamily:fonts.montserratMedium, color:'#6b7280', marginTop:2 },
  scrollContent: { paddingBottom:24 },
  grid: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:16, paddingTop:16, gap:getGridGap() },
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


