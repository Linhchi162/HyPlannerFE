import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';
import WeddingItemCard from '../components/WeddingItemCard';
import * as groomSuitService from '../service/groomSuitService';
import { Style } from '../store/weddingCostume';
import { useSelection } from '../contexts/SelectionContext';
import { getGridGap } from '../../assets/styles/utils/responsive';

const GroomMaterialScreen = () => {
  const navigation = useNavigation();
  const [items, setItems] = useState<Style[]>([]);
  const { selectedGroomVestMaterials, toggleGroomVestMaterial } = useSelection();

  useEffect(() => {
    const fetch = async () => {
      try {
        const r = await groomSuitService.getVestMaterials();
        setItems(r.data || []);
      } catch (e) {}
    };
    fetch();
  }, []);

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vest chú rể</Text>
          <Text style={styles.headerSubtitle}>Chất liệu</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.grid}>
          {items.map(item => (
            <WeddingItemCard
              key={item._id}
              id={item._id}
              name={item.name}
              image={item.image}
              isSelected={selectedGroomVestMaterials.includes(item._id)}
              onSelect={async () => await toggleGroomVestMaterial(item._id)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('GroomColor' as never)}>
          <Text style={styles.actionButtonText}>Chọn màu sắc</Text>
          <ChevronLeft size={16} color="#000000" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64, backgroundColor: '#FEF0F3' },
  headerTitleContainer: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontFamily: fonts.montserratSemiBold, color: '#1f2937' },
  headerSubtitle: { fontSize: 14, fontFamily: fonts.montserratMedium, color: '#6b7280', marginTop: 2 },
  scrollContent: { paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 16, gap: getGridGap() },
  actionButton: { backgroundColor: '#F9CBD6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 100, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  actionButtonText: { color: '#000000', textAlign: 'center', fontSize: 14, fontFamily: fonts.montserratSemiBold, marginRight: 4 },
});

export default GroomMaterialScreen;


