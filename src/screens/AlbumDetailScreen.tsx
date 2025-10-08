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
  FlatList,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useState, useEffect, useMemo } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import WeddingItemCard from '../components/WeddingItemCard';
import { fonts } from '../theme/fonts';
import { Album } from '../service/userSelectionService';
import { getItemHeight } from '../../assets/styles/utils/responsive';

const { width } = Dimensions.get('window');

interface RouteParams {
  album: Album;
}

const AlbumDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { album } = route.params as RouteParams;
  
  const [allItems, setAllItems] = useState<any[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(6); // lazy load: 3 cols x 2 rows
  const [prefetched, setPrefetched] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('Tất cả');
  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((it) => set.add(it.category));
    const ordered: string[] = [
      'Tất cả',
      'Kiểu dáng',
      'Chất liệu',
      'Cổ áo',
      'Chi tiết',
      'Voan cưới',
      'Trang sức',
      'Kẹp tóc',
      'Vương miện',
      'Hoa cưới',
      'Địa điểm',
      'Phong cách',
      'Đám cưới',
      'Lễ ăn hỏi',
      'Vest - Kiểu dáng',
      'Vest - Chất liệu',
      'Vest - Màu sắc',
      'Vest - Ve áo',
      'Vest - Túi áo',
      'Vest - Trang trí',
      'Hoa văn & Trang trí',
      'Khăn đội đầu',
      'Trang phục',
      'Phụ kiện',
    ];
    // Only keep categories that exist in items, but preserve order
    return ordered.filter((c) => c === 'Tất cả' || set.has(c));
  }, [allItems]);

  useEffect(() => {
    // Flatten all selections into a single array for display
    const items: any[] = [];
    
    if (album.selections && album.selections.length > 0) {
      album.selections.forEach(selection => {
        const anySel: any = selection as any;
        // Add styles
        if (selection.styles && selection.styles.length > 0) {
          selection.styles.forEach(style => {
            items.push({
              ...style,
              category: 'Kiểu dáng',
              categoryColor: '#FEF0F3'
            });
          });
        }
        
        // Add materials
        if (selection.materials && selection.materials.length > 0) {
          selection.materials.forEach(material => {
            items.push({
              ...material,
              category: 'Chất liệu',
              categoryColor: '#F0F9FF'
            });
          });
        }
        
        // Add necklines
        if (selection.necklines && selection.necklines.length > 0) {
          selection.necklines.forEach(neckline => {
            items.push({
              ...neckline,
              category: 'Cổ áo',
              categoryColor: '#F0FDF4'
            });
          });
        }
        
        // Add details
        if (selection.details && selection.details.length > 0) {
          selection.details.forEach(detail => {
            items.push({
              ...detail,
              category: 'Chi tiết',
              categoryColor: '#FFFBEB'
            });
          });
        }
        
        // Vest selections
        // Tone color selections
        if (anySel.weddingToneColors && anySel.weddingToneColors.length > 0) {
          anySel.weddingToneColors.forEach((v: any) => {
            items.push({ ...v, category: 'Đám cưới', categoryColor: '#FDF2F8' });
          });
        }
        if (anySel.engageToneColors && anySel.engageToneColors.length > 0) {
          anySel.engageToneColors.forEach((v: any) => {
            items.push({ ...v, category: 'Lễ ăn hỏi', categoryColor: '#FFF7ED' });
          });
        }
        if (anySel.vestStyles && anySel.vestStyles.length > 0) {
          anySel.vestStyles.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Kiểu dáng', categoryColor: '#F3E8FF' });
          });
        }
        if (anySel.vestMaterials && anySel.vestMaterials.length > 0) {
          anySel.vestMaterials.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Chất liệu', categoryColor: '#E0F2FE' });
          });
        }
        if (anySel.vestColors && anySel.vestColors.length > 0) {
          anySel.vestColors.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Màu sắc', categoryColor: '#FEE2E2' });
          });
        }
        if (anySel.vestLapels && anySel.vestLapels.length > 0) {
          anySel.vestLapels.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Ve áo', categoryColor: '#DCFCE7' });
          });
        }
        if (anySel.vestPockets && anySel.vestPockets.length > 0) {
          anySel.vestPockets.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Túi áo', categoryColor: '#FAE8FF' });
          });
        }
        if (anySel.vestDecorations && anySel.vestDecorations.length > 0) {
          anySel.vestDecorations.forEach((v: any) => {
            items.push({ ...v, category: 'Vest - Trang trí', categoryColor: '#FFFBEB' });
          });
        }

        // Bride engagement selections
        if (anySel.brideEngageStyles && anySel.brideEngageStyles.length > 0) {
          anySel.brideEngageStyles.forEach((v: any) => {
            items.push({ ...v, category: 'Kiểu dáng', categoryColor: '#FEF0F3' });
          });
        }
        if (anySel.brideEngageMaterials && anySel.brideEngageMaterials.length > 0) {
          anySel.brideEngageMaterials.forEach((v: any) => {
            items.push({ ...v, category: 'Chất liệu', categoryColor: '#F0F9FF' });
          });
        }
        if (anySel.brideEngagePatterns && anySel.brideEngagePatterns.length > 0) {
          anySel.brideEngagePatterns.forEach((v: any) => {
            items.push({ ...v, category: 'Hoa văn & Trang trí', categoryColor: '#F0FDF4' });
          });
        }
        if (anySel.brideEngageHeadwears && anySel.brideEngageHeadwears.length > 0) {
          anySel.brideEngageHeadwears.forEach((v: any) => {
            items.push({ ...v, category: 'Khăn đội đầu', categoryColor: '#FFFBEB' });
          });
        }

        // Wedding Venues & Themes
        if (anySel.weddingVenues && anySel.weddingVenues.length > 0) {
          anySel.weddingVenues.forEach((v: any) => {
            items.push({ ...v, category: 'Địa điểm', categoryColor: '#FEF0F3' });
          });
        }
        if (anySel.weddingThemes && anySel.weddingThemes.length > 0) {
          anySel.weddingThemes.forEach((v: any) => {
            items.push({ ...v, category: 'Phong cách', categoryColor: '#F0F9FF' });
          });
        }

        // Groom engagement selections
        if (anySel.groomEngageOutfits && anySel.groomEngageOutfits.length > 0) {
          anySel.groomEngageOutfits.forEach((v: any) => {
            items.push({ ...v, category: 'Trang phục', categoryColor: '#FEF0F3' });
          });
        }
        if (anySel.groomEngageAccessories && anySel.groomEngageAccessories.length > 0) {
          anySel.groomEngageAccessories.forEach((v: any) => {
            items.push({ ...v, category: 'Phụ kiện', categoryColor: '#F0F9FF' });
          });
        }

        // Add accessories
        if (selection.accessories) {
          // Veils
          if (selection.accessories.veils && selection.accessories.veils.length > 0) {
            selection.accessories.veils.forEach(veil => {
              items.push({
                ...veil,
                category: 'Voan cưới',
                categoryColor: '#FDF2F8'
              });
            });
          }
          
          // Jewelry
          if (selection.accessories.jewelries && selection.accessories.jewelries.length > 0) {
            selection.accessories.jewelries.forEach(jewelry => {
              items.push({
                ...jewelry,
                category: 'Trang sức',
                categoryColor: '#FEF3C7'
              });
            });
          }
          
          // Hairpins
          if (selection.accessories.hairpins && selection.accessories.hairpins.length > 0) {
            selection.accessories.hairpins.forEach(hairpin => {
              items.push({
                ...hairpin,
                category: 'Kẹp tóc',
                categoryColor: '#E0E7FF'
              });
            });
          }
          
          // Crowns
          if (selection.accessories.crowns && selection.accessories.crowns.length > 0) {
            selection.accessories.crowns.forEach(crown => {
              items.push({
                ...crown,
                category: 'Vương miện',
                categoryColor: '#F3E8FF'
              });
            });
          }
        }
        
        // Add flowers
        if (selection.flowers && selection.flowers.length > 0) {
          selection.flowers.forEach(flower => {
            items.push({
              ...flower,
              category: 'Hoa cưới',
              categoryColor: '#ECFDF5'
            });
          });
        }
      });
    }
    
    setAllItems(items);
  }, [album]);

  const renderAlbumItem = (item: any, index: number) => {
    const displayCategory = typeof item.category === 'string' ? item.category.replace(/^Vest\s-\s/, '') : item.category;
    return (
      <View style={styles.itemWrapper}>
        <WeddingItemCard
          id={item._id}
          name={item.name}
          image={item.image}
          isSelected={true}
          onSelect={() => {}}
          showPinButton={false}
        />
        <View style={[styles.categoryBadge, { backgroundColor: item.categoryColor }]}>
          <Text style={styles.categoryText}>{displayCategory}</Text>
        </View>
      </View>
    );
  };

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  const filteredItems = useMemo(() => {
    const items = allItems.filter((it) => categoryFilter === 'Tất cả' || it.category === categoryFilter);
    return items;
  }, [allItems, categoryFilter]);

  const pagedItems = useMemo(() => {
    return filteredItems.slice(0, Math.min(visibleCount, filteredItems.length));
  }, [filteredItems, visibleCount]);

  // Prefetch images for current page to avoid flash/missing
  useEffect(() => {
    const toPrefetch = pagedItems.filter((it) => it.image && !prefetched[it._id]);
    if (toPrefetch.length === 0) return;
    toPrefetch.forEach(async (it) => {
      try {
        await Image.prefetch(encodeURI(it.image));
      } catch {}
      finally {
        setPrefetched((p) => ({ ...p, [it._id]: true }));
      }
    });
  }, [pagedItems]);

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{album.name}</Text>
          <Text style={styles.headerSubtitle}>{allItems.length} mục đã chọn</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Bar by category - rebuilt with FlatList and fixed heights */}
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterBar}
          ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
          renderItem={({ item }) => {
            const display = typeof item === 'string' ? item.replace(/^Vest\s-\s/, '') : item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, categoryFilter === item && styles.filterChipActive]}
                onPress={() => setCategoryFilter(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterText}>{display}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Album Items Grid - FlatList to avoid image recycling issues */}
      <FlatList
        data={pagedItems}
        keyExtractor={(item: any) => `${item._id}-${item.category}`}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item, index }) => renderAlbumItem(item, index)}
        contentContainerStyle={styles.scrollContent}
        removeClippedSubviews
        windowSize={5}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        updateCellsBatchingPeriod={80}
        extraData={categoryFilter}
        getItemLayout={(data, index) => {
          const cardHeight = getItemHeight() + 24 + 40; // image + margin + text/badge approx
          const row = Math.floor(index / 3);
          return { length: cardHeight, offset: cardHeight * row, index };
        }}
        onEndReachedThreshold={0.3}
        onEndReached={() => {
          if (visibleCount < filteredItems.length) {
            setVisibleCount((c) => Math.min(c + 6, filteredItems.length)); // thêm 2 hàng (3x2)
          }
        }}
        showsVerticalScrollIndicator={false}
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
    paddingTop: 0,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 0,
    gap: 8,
  },
  filterWrapper: {
    height: 44,
    marginBottom: 12,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 12,
    height: 32,
    paddingVertical: 0,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignSelf: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  filterChipActive: {
    backgroundColor: '#F9CBD6',
    borderWidth: 0,
  },
  filterText: {
    fontFamily: fonts.montserratMedium,
    color: '#1f2937',
    fontSize: 12,
    lineHeight: 16,
  },
  filterTextActive: {
    // Keep same font family to avoid chip height change
    fontFamily: fonts.montserratMedium,
  },
  itemWrapper: {
    position: 'relative',
    width: (width - 48) / 3, // 3 cards per row with 16px padding on each side
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: fonts.montserratSemiBold,
    color: '#1f2937',
  },
});

export default AlbumDetailScreen;
