// In src/navigation/AppNavigator.tsx
import React from "react";
import { Text } from "react-native";
import { NavigationContainer, LinkingOptions } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";

const scheme = process.env.EXPO_PUBLIC_SCHEME;

// Bạn có thể giữ hoặc xóa type User này
export type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

// THAY ĐỔI Ở ĐÂY
export type RootStackParamList = {
  Login?: {
    token?: string;
    user?: string;
    error?: string;
  };
  // HomeScreen bây giờ chỉ cần nhận token
  Home: { token: string; user?: any };
};

const Stack = createStackNavigator<RootStackParamList>();

// Cấu hình linking không đổi, vẫn rất chính xác
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${scheme}://`],
  config: {
    screens: {
      Login: "auth",
    },
  },
};

const AppNavigator = () => (
  <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
