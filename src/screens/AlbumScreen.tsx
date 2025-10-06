import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  Text,
  StatusBar,
  Platform,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import AlbumCard from '../components/AlbumCard';
import * as userSelectionService from '../service/userSelectionService';
import { Album } from '../service/userSelectionService';
import { fonts } from '../theme/fonts';

const AlbumScreen = () => {
  const navigation = useNavigation();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filter, setFilter] = useState<'all' | 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color' | 'wedding-venue' | 'wedding-theme'>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  // Refetch whenever screen gains focus to reflect newly created albums
  useFocusEffect(
    useCallback(() => {
      fetchAlbums();
      return () => {};
    }, [])
  );

  const fetchAlbums = async () => {
    setIsLoading(true);
    try {
      const response = await userSelectionService.getUserAlbums();
      setAlbums(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tải albums');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewAlbum = () => {
    navigation.navigate('ChooseStyle' as never);
  };

  const handleAlbumPress = (album: Album) => {
    navigation.navigate('AlbumDetail' as never, { album } as never);
  };

  const getFirstImage = (_album: Album): string => {
    // Always use default image; ignore album content preview
    return '';
  };

  const getAlbumType = (album: Album): 'wedding-dress' | 'vest' | 'bride-engage' | 'groom-engage' | 'tone-color' | 'wedding-venue' | 'wedding-theme' | 'unknown' => {
    if (album.selections && album.selections.length > 0) {
      const anySel: any = album.selections[0];
      if (
        anySel.type === 'wedding-dress' ||
        anySel.type === 'vest' ||
        anySel.type === 'bride-engage' ||
        anySel.type === 'groom-engage' ||
        anySel.type === 'tone-color' ||
        anySel.type === 'wedding-venue' ||
        anySel.type === 'wedding-theme'
      ) return anySel.type;
      // Infer by fields when type not populated
      if (anySel.vestStyles || anySel.vestMaterials || anySel.vestColors || anySel.vestLapels || anySel.vestPockets || anySel.vestDecorations) return 'vest';
      if (anySel.brideEngageStyles || anySel.brideEngageMaterials || anySel.brideEngagePatterns || anySel.brideEngageHeadwears) return 'bride-engage';
      if (anySel.groomEngageOutfits || anySel.groomEngageAccessories) return 'groom-engage';
      if (anySel.weddingToneColors || anySel.engageToneColors) return 'tone-color';
      if (anySel.weddingVenues) return 'wedding-venue';
      if (anySel.weddingThemes) return 'wedding-theme';
      return 'wedding-dress';
    }
    return 'unknown';
  };

  const visibleAlbums = albums.filter((a) => {
    if (filter === 'all') return true;
    return getAlbumType(a) === filter;
  });

  const topPad = Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 0;

  return (
    <SafeAreaView style={[styles.container, { paddingTop: topPad }] }>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <ChevronLeft size={24} color="#1f2937" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Home' })}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Profile' as never)}>
          <Image
            source={require('../../assets/images/default.png')}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Bar */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'all' && styles.filterChipActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>Tất cả</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'wedding-venue' && styles.filterChipActive]}
            onPress={() => setFilter('wedding-venue')}
          >
            <Text style={[styles.filterText, filter === 'wedding-venue' && styles.filterTextActive]}>Địa điểm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'wedding-theme' && styles.filterChipActive]}
            onPress={() => setFilter('wedding-theme')}
          >
            <Text style={[styles.filterText, filter === 'wedding-theme' && styles.filterTextActive]}>Phong cách</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'wedding-dress' && styles.filterChipActive]}
            onPress={() => setFilter('wedding-dress')}
          >
            <Text style={[styles.filterText, filter === 'wedding-dress' && styles.filterTextActive]}>Váy cưới</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'vest' && styles.filterChipActive]}
            onPress={() => setFilter('vest')}
          >
            <Text style={[styles.filterText, filter === 'vest' && styles.filterTextActive]}>Vest</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'bride-engage' && styles.filterChipActive]}
            onPress={() => setFilter('bride-engage')}
          >
            <Text style={[styles.filterText, filter === 'bride-engage' && styles.filterTextActive]}>Áo dài</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'groom-engage' && styles.filterChipActive]}
            onPress={() => setFilter('groom-engage')}
          >
            <Text style={[styles.filterText, filter === 'groom-engage' && styles.filterTextActive]}>Trang phục</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filter === 'tone-color' && styles.filterChipActive]}
            onPress={() => setFilter('tone-color')}
          >
            <Text style={[styles.filterText, filter === 'tone-color' && styles.filterTextActive]}>Tone màu</Text>
          </TouchableOpacity>
        </ScrollView>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Đang tải albums...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAlbums}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.albumGrid}>
            {visibleAlbums.map((album) => (
              <AlbumCard
                key={album._id}
                id={album._id}
                title={album.name}
                imageUrl={getFirstImage(album)}
                onPress={() => handleAlbumPress(album)}
              />
            ))}
            <AlbumCard
              id="add-new"
              title="Thêm Album mới"
              isAddNew
              onPress={handleAddNewAlbum}
            />
          </View>
        )}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  logo: {
    height: 32,
    width: 48,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
  },
  filterChipActive: {
    backgroundColor: '#F9CBD6',
  },
  filterText: {
    fontFamily: fonts.montserratMedium,
    color: '#1f2937',
    fontSize: 12,
  },
  filterTextActive: {
    fontFamily: fonts.montserratSemiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: fonts.montserratMedium,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorText: {
    fontSize: 16,
    fontFamily: fonts.montserratMedium,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#F9CBD6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: fonts.montserratSemiBold,
    color: '#1f2937',
  },
});

export default AlbumScreen;
