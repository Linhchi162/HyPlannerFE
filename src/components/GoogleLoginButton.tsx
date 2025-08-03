// In src/components/GoogleLoginButton.tsx
import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  GestureResponderEvent,
  View,
} from "react-native";
import { Svg, Path } from "react-native-svg";

// Define the type for the component's props
type GoogleLoginButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  loading: boolean;
};

// Google Icon SVG Component
const GoogleIcon = () => (
  <Svg width="18" height="18" viewBox="0 0 18 18" style={styles.icon}>
    <Path
      d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z"
      fill="#4285F4"
    />
    <Path
      d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1232 10.2109 14.4523 9 14.4523C6.96273 14.4523 5.22545 13.0482 4.545 11.225L1.53136 13.4832C3.01636 16.2218 5.79545 18 9 18Z"
      fill="#34A853"
    />
    <Path
      d="M4.545 11.225C4.34909 10.6364 4.24091 10.0091 4.24091 9.36364C4.24091 8.71818 4.34909 8.09091 4.545 7.50227V5.24409L1.53136 2.98636C0.572727 4.92545 0 7.05455 0 9.36364C0 11.6727 0.572727 13.8018 1.53136 15.7409L4.545 11.225Z"
      fill="#FBBC05"
    />
    <Path
      d="M9 4.27273C10.3214 4.27273 11.5077 4.75591 12.4786 5.68182L15.0218 3.13864C13.4632 1.58182 11.4259 0.727273 9 0.727273C5.79545 0.727273 3.01636 2.50545 1.53136 5.24409L4.545 7.50227C5.22545 5.67955 6.96273 4.27273 9 4.27273Z"
      fill="#EA4335"
    />
  </Svg>
);

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onPress,
  loading,
}) => {
  return (
    <TouchableOpacity
      style={styles.button}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <View style={styles.buttonContent}>
          <GoogleIcon />
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
});

export default GoogleLoginButton;
