import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Plus } from 'lucide-react-native';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');
const DEFAULT_ALBUM_IMAGE_URL = 'https://www.brides.com/thmb/fZBzhWRjH5ZaCgOqjO7kc1ZJEsQ=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/recirc-texas-garden-glass-tent-wedding-couple-portrait-jose-villa-0924-cbc6f4f2a3c04ed59c464413e1fbc785.JPG';
const CARD_WIDTH = (width - 48) / 2; // 2 columns with 16px padding on each side and 16px gap

// Ensure consistent measurement when layout changes; if parent padding/gap differs on some screens,
// we can clamp a minimum width to avoid rounding shrink issues
const MIN_CARD_WIDTH = 150;

interface AlbumCardProps {
  id: string;
  title: string;
  imageUrl?: string;
  isAddNew?: boolean;
  onPress: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({
  title,
  imageUrl,
  isAddNew,
  onPress,
}) => {
  if (isAddNew) {
    return (
      <TouchableOpacity style={styles.addNewContainer} onPress={onPress}>
        <Plus size={24} color="#9ca3af" />
        <Text style={styles.addNewText}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image 
        source={imageUrl ? imageUrl : DEFAULT_ALBUM_IMAGE_URL}
        style={styles.image}
        contentFit="cover"
        cachePolicy="immutable"
        transition={0}
        placeholder={require('../../assets/images/default.png') as any}
      />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minWidth: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minHeight: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addNewContainer: {
    width: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minWidth: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    minHeight: Math.max(CARD_WIDTH, MIN_CARD_WIDTH),
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.montserratMedium,
    color: '#ffffff',
  },
  addNewText: {
    marginTop: 8,
    fontSize: 14,
    fontFamily: fonts.montserratMedium,
    color: '#6b7280',
  },
});

export default AlbumCard;
