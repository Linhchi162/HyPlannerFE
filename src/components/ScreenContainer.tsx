import React from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
}

/**
 * Container component that handles safe area and status bar for all screens
 * Use this instead of SafeAreaView directly to ensure consistent behavior
 */
export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  backgroundColor = "#ffffff",
}) => {
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor }]}
      edges={["top", "bottom"]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
  },
});
