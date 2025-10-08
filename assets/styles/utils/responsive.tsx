import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive scaling based on screen size
const scale = screenWidth / 375; // Base width (iPhone X)
const verticalScale = screenHeight / 812; // Base height (iPhone X)

// Helper functions for responsive sizing
export const responsiveWidth = (size: number) => size * scale;
export const responsiveHeight = (size: number) => size * verticalScale;
export const responsiveFont = (size: number) => size * Math.min(scale, 1.2); // Limit font scaling

// Grid utilities for 3 items per row
export const getItemWidth = () => {
  const paddingHorizontal = 32; // 16px on each side
  const gap = 8;
  const availableWidth = screenWidth - paddingHorizontal;
  const totalGapWidth = gap * 2; // 2 gaps between 3 items
  return (availableWidth - totalGapWidth) / 3;
};

export const getItemHeight = () => {
  const itemWidth = getItemWidth();
  return (itemWidth * 170) / 120; // Maintain aspect ratio from original 120x170
};

export const getGridGap = () => 8; 