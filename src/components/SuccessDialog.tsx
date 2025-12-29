import React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Portal, Dialog, Button } from "react-native-paper";
import {
  responsiveFont,
  responsiveWidth,
  responsiveHeight,
} from "../../assets/styles/utils/responsive";

interface SuccessDialogProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  title?: string;
  buttonText?: string;
  buttonColor?: string;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({
  visible,
  message,
  onDismiss,
  title = "Thành công",
  buttonText = "Đóng",
  buttonColor = "#4CAF50",
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <View style={styles.iconContainer}>
          <Dialog.Icon icon="check-circle" size={64} color="#4CAF50" />
        </View>
        <Dialog.Title style={styles.title}>{title}</Dialog.Title>
        <Dialog.Content>
          <Text style={styles.message}>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions style={styles.actions}>
          <Button
            onPress={onDismiss}
            mode="contained"
            buttonColor={buttonColor}
            style={styles.button}
            labelStyle={styles.buttonLabel}
          >
            {buttonText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  dialog: {
    borderRadius: responsiveWidth(20),
    backgroundColor: "#FFFFFF",
  },
  iconContainer: {
    marginTop: responsiveHeight(12),
    marginBottom: responsiveHeight(4),
  },
  title: {
    textAlign: "center",
    color: "#4CAF50",
    fontSize: responsiveFont(20),
    fontFamily: "Montserrat-SemiBold",
    fontWeight: "600",
    marginTop: responsiveHeight(4),
    marginBottom: responsiveHeight(8),
    lineHeight: responsiveFont(28),
    minHeight: responsiveHeight(32),
  },
  message: {
    textAlign: "center",
    fontSize: responsiveFont(15),
    fontFamily: "Montserrat-Regular",
    color: "#666",
    lineHeight: responsiveFont(24),
    paddingHorizontal: responsiveWidth(16),
    paddingVertical: responsiveHeight(8),
    minHeight: responsiveHeight(28),
  },
  actions: {
    justifyContent: "center",
    paddingBottom: responsiveHeight(16),
    paddingTop: responsiveHeight(12),
  },
  button: {
    paddingHorizontal: responsiveWidth(40),
    paddingVertical: responsiveHeight(10),
    borderRadius: responsiveWidth(12),
    minHeight: responsiveHeight(48),
  },
  buttonLabel: {
    fontSize: responsiveFont(15),
    fontFamily: "Montserrat-Medium",
    fontWeight: "500",
    lineHeight: responsiveFont(22),
  },
});

export default SuccessDialog;
