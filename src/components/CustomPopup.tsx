import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
} from "react-native";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react-native";
import { fonts } from "../theme/fonts";

const { width: screenWidth } = Dimensions.get("window");

interface CustomPopupProps {
  visible: boolean;
  type: "success" | "error" | "warning";
  title: string;
  message: string;
  onClose: () => void;
  buttonText?: string;
  onButtonPress?: () => void;
}

const CustomPopup: React.FC<CustomPopupProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  buttonText,
  onButtonPress,
}) => {
  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle size={48} color="#10B981" />;
      case "error":
        return <XCircle size={48} color="#EF4444" />;
      case "warning":
        return <AlertCircle size={48} color="#F59E0B" />;
      default:
        return <AlertCircle size={48} color="#6B7280" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "#F0FDF4";
      case "error":
        return "#FEF2F2";
      case "warning":
        return "#FFFBEB";
      default:
        return "#F9FAFB";
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case "success":
        return "#D1FAE5";
      case "error":
        return "#FECACA";
      case "warning":
        return "#FED7AA";
      default:
        return "#E5E7EB";
    }
  };

  const handleButtonPress = () => {
    if (onButtonPress) {
      onButtonPress();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {
        if (type !== "warning") {
          onClose();
        }
      }}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.popup,
            {
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
            },
          ]}
        >
          <View style={styles.iconContainer}>{getIcon()}</View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {type !== "warning" && typeof buttonText === "string" && (
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor:
                    type === "success"
                      ? "#10B981"
                      : type === "error"
                      ? "#EF4444"
                      : "#F59E0B",
                },
              ]}
              onPress={handleButtonPress}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>{buttonText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  popup: {
    width: screenWidth - 40,
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.montserratSemiBold,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    fontFamily: fonts.montserratMedium,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 16,
    fontFamily: fonts.montserratSemiBold,
    color: "#FFFFFF",
  },
});

export default CustomPopup;
