import React from "react";
import { View, StyleSheet, StatusBar, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: "dark-content" | "light-content";
}

/**
 * Container component that handles safe area and status bar for all screens
 * Use this instead of SafeAreaView directly to ensure consistent behavior
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  backgroundColor = "#ffffff",
  statusBarStyle = "dark-content",
}) => {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "bottom"]}
    >
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={backgroundColor}
        translucent={false}
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0,
  },
});
