import React from "react";
import { Text } from "react-native";
import { Portal, Dialog, Button } from "react-native-paper";
import { responsiveFont } from "../../assets/styles/utils/responsive";

interface ErrorDialogProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  title?: string;
  buttonText?: string;
  buttonColor?: string;
}

export const ErrorDialog: React.FC<ErrorDialogProps> = ({
  visible,
  message,
  onDismiss,
  title = "Thông báo lỗi",
  buttonText = "Đóng",
  buttonColor = "#F44336",
}) => {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Icon icon="alert-circle" size={48} />
        <Dialog.Title style={{ textAlign: "center", color: buttonColor }}>
          {title}
        </Dialog.Title>
        <Dialog.Content>
          <Text style={{ textAlign: "center", fontSize: responsiveFont(14) }}>
            {message}
          </Text>
        </Dialog.Content>
        <Dialog.Actions style={{ justifyContent: "center" }}>
          <Button
            onPress={onDismiss}
            mode="contained"
            buttonColor={buttonColor}
            style={{ paddingHorizontal: 20 }}
          >
            {buttonText}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
};

export default ErrorDialog;
