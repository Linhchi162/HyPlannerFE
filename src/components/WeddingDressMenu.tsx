import React from 'react';
import { fonts } from '../theme/fonts';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';

type RootStackParamList = {
  WeddingMaterial: undefined;
  WeddingNeckline: undefined;
  WeddingDetail: undefined;
};

type NavigationProps = NavigationProp<RootStackParamList>;


const { width } = Dimensions.get('window');

interface WeddingDressMenuProps {
  visible: boolean;
  currentScreen: string;
  onClose: () => void;
}

const menuItems = [
  { id: 'style', title: 'Kiểu dáng', screen: 'WeddingDress' },
  { id: 'material', title: 'Chất liệu', screen: 'WeddingMaterial' },
  { id: 'neckline', title: 'Cổ áo', screen: 'WeddingNeckline' },
  { id: 'details', title: 'Chi tiết', screen: 'WeddingDetail' },
];

const WeddingDressMenu = ({ visible, currentScreen, onClose }: WeddingDressMenuProps) => {
  const navigation = useNavigation<NavigationProps>();

  const handleMenuItemPress = (item: typeof menuItems[0]) => {
    if (item.screen) {
      navigation.navigate(item.screen);
    }
    onClose();
  };

  return visible ? (
    <View style={styles.menuWrapper}>
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItemOuter,
              currentScreen === item.screen && styles.menuItemActive
            ]}
            onPress={() => handleMenuItemPress(item)}
          >
            <Text style={[
              styles.menuItemText,
              currentScreen === item.screen && styles.menuItemTextActive
            ]}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  menuWrapper: {
    position: 'absolute',
    top: 96, // further offset below header
    right: 8,
    zIndex: 1000,
  },
  menuContainer: {
    backgroundColor: '#FEF0F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    width: width * 0.4,
    borderRadius: 16,
  },
  menuItemOuter: {
    backgroundColor: '#FEE5EE',
    borderRadius: 16,
    marginVertical: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#DDB2B1',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: fonts.montserratMedium,
  },
  menuItemActive: {
    backgroundColor: '#FFD4E3',
  },
  menuItemTextActive: {
    fontFamily: fonts.montserratSemiBold,
  },
});

export default WeddingDressMenu;