import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');

interface GroomAccessoriesMenuProps {
  visible: boolean;
  onClose: () => void;
  currentScreen?: string;
}

const menuItems = [
  { id: 'lapel', title: 'Ve áo', screen: 'GroomAccessoriesLapel' },
  { id: 'pocket', title: 'Túi áo', screen: 'GroomAccessoriesPocketSquare' },
  { id: 'decor', title: 'Trang trí', screen: 'GroomAccessoriesDecor' },
];

const GroomAccessoriesMenu: React.FC<GroomAccessoriesMenuProps> = ({ visible, onClose, currentScreen }) => {
  const navigation = useNavigation();

  if (!visible) return null;

  return (
    <View style={styles.menuWrapper}>
      <View style={styles.menuContainer}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.menuItemOuter, currentScreen === item.screen && styles.menuItemActive]}
            onPress={() => {
              if (item.screen) navigation.navigate(item.screen as never);
              onClose();
            }}
          >
            <Text style={[styles.menuItemText, currentScreen === item.screen && styles.menuItemTextActive]}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  menuWrapper: {
    position: 'absolute',
    top: 96,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemActive: {
    backgroundColor: '#FFD4E3',
  },
  menuItemText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    fontFamily: fonts.montserratMedium,
  },
  menuItemTextActive: {
    fontFamily: fonts.montserratSemiBold,
  },
});

export default GroomAccessoriesMenu;


