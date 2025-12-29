import { Dimensions, PixelRatio } from "react-native";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Responsive scaling based on screen size
const scale = screenWidth / 375; // Base width (iPhone X)
const verticalScale = screenHeight / 812; // Base height (iPhone X)

// Helper functions for responsive sizing
export const responsiveWidth = (size: number) => size * scale;
export const responsiveHeight = (size: number) => size * verticalScale;
export const responsiveFont = (size: number) => {
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Moderate scale - good for padding, margin, borderRadius
export const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale - 1) * factor * size;
};

// Spacing utilities
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
};

// Border radius utilities
export const borderRadius = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  full: 9999,
};

// Responsive utilities for common use cases
export const rw = responsiveWidth; // Alias for width
export const rh = responsiveHeight; // Alias for height
export const rf = responsiveFont; // Alias for font
export const ms = moderateScale; // Alias for moderate scale

// Grid utilities for 3 items per row
export const getItemWidth = (
  itemsPerRow = 3,
  horizontalPadding = 32,
  gap = 8
) => {
  const availableWidth = screenWidth - horizontalPadding;
  const totalGapWidth = gap * (itemsPerRow - 1);
  return (availableWidth - totalGapWidth) / itemsPerRow;
};

export const getItemHeight = (aspectRatio = 170 / 120) => {
  const itemWidth = getItemWidth();
  return itemWidth * aspectRatio;
};

export const getGridGap = () => moderateScale(8);

// Screen dimensions
export const SCREEN_WIDTH = screenWidth;
export const SCREEN_HEIGHT = screenHeight;

// Check if device is small (width < 375)
export const isSmallDevice = screenWidth < 375;

// Check if device is tablet
export const isTablet = screenWidth >= 768;
