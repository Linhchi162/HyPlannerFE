import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "react-native";
import { VendorStackParamList } from "./types";
import VendorDashboardScreen from "../screens/vendor/VendorDashboardScreen";
import VendorProfileEditScreen from "../screens/vendor/VendorProfileEditScreen";
import VendorChangePasswordScreen from "../screens/vendor/VendorChangePasswordScreen";
import VendorServicesScreen from "../screens/vendor/VendorServicesScreen";
import VendorRequestsScreen from "../screens/vendor/VendorRequestsScreen";
import VendorPromotionsScreen from "../screens/vendor/VendorPromotionsScreen";
import VendorPromotionEditScreen from "../screens/vendor/VendorPromotionEditScreen";
import ChatListScreen from "../screens/chat/ChatListScreen";
import ChatDetailScreen from "../screens/chat/ChatDetailScreen";

const Stack = createStackNavigator<VendorStackParamList>();

export default function VendorStackNavigator() {
  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#f7577c"
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
        <Stack.Screen
          name="VendorPromotions"
          component={VendorPromotionsScreen}
        />
        <Stack.Screen
          name="VendorPromotionEdit"
          component={VendorPromotionEditScreen}
        />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
      </Stack.Navigator>
    </>
  );
}
