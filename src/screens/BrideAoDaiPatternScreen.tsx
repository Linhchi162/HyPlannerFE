import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { LayoutAnimation } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import WeddingItemCard from '../components/WeddingItemCard';
import * as brideEngageService from '../service/brideEngageService';
import { Style } from '../store/weddingCostume';
import EngagementBrideMenu from '../components/EngagementBrideMenu';
import { getGridGap } from '../../assets/styles/utils/responsive';

export default function BrideAoDaiPatternScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [items, setItems] = useState<Style[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => { brideEngageService.getAllBrideEngagePatterns().then(r=>setItems(r.data)); }, []);
  const toggle = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;
  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><ChevronLeft size={24} color="#1f2937" /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>Áo dài</Text><Text style={styles.headerSubtitle}>Hoa văn & Trang trí</Text></View>
        <TouchableOpacity onPress={() => {
          if (!menuVisible) {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          }
          setMenuVisible(!menuVisible);
        }}><Menu size={24} color="#1f2937" /></TouchableOpacity>
      </View>
      <EngagementBrideMenu visible={menuVisible} currentScreen="BrideAoDaiPattern" onClose={()=>setMenuVisible(false)} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {items.map(it => (
            <WeddingItemCard key={it._id} id={it._id} name={it.name} image={it.image} isSelected={selected.includes(it._id)} onSelect={()=>toggle(it._id)} />
          ))}
        </View>
        <TouchableOpacity style={styles.actionButton} onPress={()=>navigation.navigate('BrideHeadscarf' as never)}>
          <Text style={styles.actionButtonText}>Chọn khăn đội đầu</Text>
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
  grid: { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:16, paddingTop:16, gap:getGridGap() },
  actionButton: { backgroundColor:'#F9CBD6', paddingVertical:8, paddingHorizontal:16, borderRadius:100, marginTop:16, alignSelf:'center' },
  actionButtonText: { color:'#000', textAlign:'center', fontSize:14, fontFamily:fonts.montserratSemiBold },
});


