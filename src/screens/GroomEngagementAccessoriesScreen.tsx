import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import CustomPopup from '../components/CustomPopup';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import WeddingItemCard from '../components/WeddingItemCard';
import * as groomEngageService from '../service/groomEngageService';
import { Style } from '../store/weddingCostume';
import EngagementGroomMenu from '../components/EngagementGroomMenu';
import { getGridGap } from '../../assets/styles/utils/responsive';
import { useSelection } from '../contexts/SelectionContext';

export default function GroomEngagementAccessoriesScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<Style[]>([]);
  const { selectedGroomEngageAccessories, toggleGroomEngageAccessory, saveSelections, createAlbum } = useSelection();
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [popupType, setPopupType] = useState<'success' | 'error' | null>(null);
  const [popupMessage, setPopupMessage] = useState('');
  useEffect(() => { groomEngageService.getAllGroomEngageAccessories().then(r=>setItems(r.data)); }, []);
  
  const handleCreateAlbum = async () => {
    setIsCreatingAlbum(true);
    try {
      await saveSelections();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await createAlbum('groom-engage');
      setPopupType('success');
      setPopupMessage('Album đã được tạo thành công!');
      setTimeout(() => {
        navigation.navigate('Album' as never);
      }, 1500);
    } catch (error) {
      setPopupType('error');
      setPopupMessage('Có lỗi xảy ra khi tạo album');
    } finally {
      setIsCreatingAlbum(false);
    }
  };
  
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;
  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>Lễ ăn hỏi</Text><Text style={styles.headerSubtitle}>Phụ kiện</Text></View>
        <TouchableOpacity onPress={() => {
          if (!menuVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          setMenuVisible(!menuVisible);
        }}><Menu size={24} color="#1f2937" /></TouchableOpacity>
      </View>
      <EngagementGroomMenu visible={menuVisible} currentScreen="GroomEngagementAccessories" onClose={()=>setMenuVisible(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {items.map(it => (
            <WeddingItemCard key={it._id} id={it._id} name={it.name} image={it.image} isSelected={selectedGroomEngageAccessories.includes(it._id)} onSelect={async () => await toggleGroomEngageAccessory(it._id)} />
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
        </TouchableOpacity>
      </ScrollView>
      
      <CustomPopup
        visible={popupType !== null}
        type={popupType || 'success'}
        message={popupMessage}
        onClose={() => setPopupType(null)}
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
  actionButton: { backgroundColor:'#F9CBD6', paddingVertical:12, paddingHorizontal:24, borderRadius:100, marginTop:16, alignSelf:'center' },
  actionButtonText: { color:'#000', textAlign:'center', fontSize:16, fontFamily:fonts.montserratSemiBold },
  actionButtonDisabled: { backgroundColor:'#E5E7EB', opacity:0.6 },
});


