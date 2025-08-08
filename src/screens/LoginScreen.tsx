// In src/screens/LoginScreen.js
import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../navigation/AppNavigator";
import apiClient from "../api/client"; // Ensure you have this file
import GoogleLoginButton from "../components/GoogleLoginButton"; // Import the new component
import FacebookLoginButton from "../components/FacebookLoginButton";
import {
  LoginManager,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk-next';


WebBrowser.maybeCompleteAuthSession();
const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  const handleGoogleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!backendUrl) {
        throw new Error(
          "EXPO_PUBLIC_BASE_URL is not defined. Please check your environment variables."
        );
      }
      const authUrl = `${backendUrl}/auth/google`;

      // 1. Call and get the result back
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        process.env.EXPO_PUBLIC_SCHEME // Just the scheme is needed here
      );

      // 2. Handle the result
      if (result.type === "success") {
        const { url } = result;

        // 3. Get token from URL
        // Use URL API to parse the URL safely
        const urlObj = new URL(url);
        const token = urlObj.searchParams.get("token");

        if (token) {
          // 4. Save token and get user info
          await AsyncStorage.setItem("appToken", token);

          // apiClient will automatically attach the token to the header
          const response = await apiClient.get("/auth/me");
          const user = response.data;

          await AsyncStorage.setItem("userData", JSON.stringify(user));

          // 5. Navigate to the Home screen
          navigation.navigate("Home", { token, user });
        } else {
          console.error("Could not find token in the redirect URL");
          Alert.alert("Login failed", "Invalid response from server.");
        }
      } else {
        // User cancelled the login process
        console.log("User cancelled Google Sign-In");
      }
    } catch (error) {
      console.error("Error during Google sign-in:", error);
      Alert.alert(
        "Login Error",
        "An error occurred during login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigation]);
  // login with Facebook
  const handleFacebookLogin = async () => {
    try {
      setLoading(true);
      const loginResult = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      if (loginResult.isCancelled) {
        Alert.alert('Thông báo', 'Đăng nhập đã bị hủy.');
        setLoading(false);
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        Alert.alert('Lỗi', 'Không thể lấy được token truy cập.');
        setLoading(false);
        return;
      }
      const facebookAccessToken = data.accessToken;

      // Gửi accessToken Facebook lên backend để lấy accessToken riêng
      const backendUrl = process.env.EXPO_PUBLIC_BASE_URL;
      if (!backendUrl) {
        throw new Error(
          "EXPO_PUBLIC_BASE_URL is not defined. Please check your environment variables."
        );
      }
      const response = await apiClient.post("/auth/facebook/token", {
        access_token: facebookAccessToken,
      });
      const { token, user } = response.data as { token: string; user: any };

      await AsyncStorage.setItem("appToken", token);
      await AsyncStorage.setItem("userData", JSON.stringify(user));

      navigation.navigate("Home", { token, user });
    } catch (error) {
      console.error('Error during Facebook login:', error);
      Alert.alert('Lỗi', `Đăng nhập thất bại: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <GoogleLoginButton loading={loading} onPress={handleGoogleSignIn} />
      <FacebookLoginButton onLogin={handleFacebookLogin} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5", // Added a light background color
  },
});

export default LoginScreen;
