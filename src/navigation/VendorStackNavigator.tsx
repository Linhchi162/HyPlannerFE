import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "react-native";
import VendorDashboardScreen from "../screens/vendor/VendorDashboardScreen";
import VendorProfileEditScreen from "../screens/vendor/VendorProfileEditScreen";
import VendorChangePasswordScreen from "../screens/vendor/VendorChangePasswordScreen";
import VendorServicesScreen from "../screens/vendor/VendorServicesScreen";
import VendorRequestsScreen from "../screens/vendor/VendorRequestsScreen";
import ChatListScreen from "../screens/chat/ChatListScreen";
import ChatDetailScreen from "../screens/chat/ChatDetailScreen";

export type VendorStackParamList = {
  VendorDashboard: undefined;
  VendorProfileEdit: undefined;
  VendorChangePassword: undefined;
  VendorServices: undefined;
  VendorRequests: undefined;
  ChatList: { role?: "user" | "vendor" } | undefined;
  ChatDetail: { peerName?: string; role?: "user" | "vendor" } | undefined;
};

const Stack = createStackNavigator<VendorStackParamList>();

export default function VendorStackNavigator() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#ff5a7a"
        translucent={false}
      />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VendorDashboard" component={VendorDashboardScreen} />
        <Stack.Screen
          name="VendorProfileEdit"
          component={VendorProfileEditScreen}
        />
        <Stack.Screen
          name="VendorChangePassword"
          component={VendorChangePasswordScreen}
        />
        <Stack.Screen name="VendorServices" component={VendorServicesScreen} />
        <Stack.Screen name="VendorRequests" component={VendorRequestsScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      </Stack.Navigator>
    </>
  );
}
