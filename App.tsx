import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect, useState, useRef } from "react";
import { PaperProvider } from "react-native-paper";
import * as Font from "expo-font";
import { Provider, useSelector } from "react-redux";
import { store, persistor } from "./src/store/store";
import { PersistGate } from "redux-persist/integration/react";
import { SelectionProvider } from "./src/contexts/SelectionContext";
import { AlbumCreationProvider } from "./src/contexts/AlbumCreationContext";
import RootStackNavigator from "./src/navigation/RootStackNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  removeNotificationSubscription,
} from "./src/utils/pushNotification";
import { updatePushToken } from "./src/service/authService";
import { selectCurrentToken } from "./src/store/authSlice";
import { useAppInitialization } from "./src/hooks/useAppInitialization";
import ErrorBoundary from "./src/components/ErrorBoundary";

// Component to handle push token registration after auth
function PushTokenRegistrar() {
  const token = useSelector(selectCurrentToken);
  const [tokenRegistered, setTokenRegistered] = useState(false);

  useEffect(() => {
    // Only register push token when user is logged in
    if (token && !tokenRegistered) {
      registerForPushNotificationsAsync()
        .then(async (pushToken) => {
          if (pushToken) {
            await updatePushToken(pushToken);
            setTokenRegistered(true);
          }
        })
        .catch((error) => {
          console.warn("Push token registration failed:", error.message);
        });
    }

    // Reset registration flag when user logs out
    if (!token && tokenRegistered) {
      setTokenRegistered(false);
    }
  }, [token]);

  return null;
}

// ✅ Component to initialize app data centrally
function AppDataInitializer() {
  useAppInitialization();
  return null;
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    Font.loadAsync({
      Agbalumo: require("./assets/fonts/Agbalumo-Regular.ttf"),
      "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf"),
      "Montserrat-SemiBold": require("./assets/fonts/Montserrat-SemiBold.ttf"),
      "Gwendolyn-Regular": require("./assets/fonts/Gwendolyn-Regular.ttf"),
      // ...các font khác
    }).then(() => setFontsLoaded(true));

    // Listener for notifications received while app is in foreground
    try {
      notificationListener.current = addNotificationReceivedListener(
        (notification) => {
          console.log("📩 Notification received:", notification);
        }
      );

      // Listener for when user taps on a notification
      responseListener.current = addNotificationResponseListener((response) => {
        console.log("👆 Notification tapped:", response);
        const data = response.notification.request.content.data;

        // Navigate based on notification type
        if (data?.guestId || data?.weddingEventId) {
          // Will be handled by navigation listeners in the app
          console.log("Navigation data:", data);
        }
      });
    } catch (error) {
      console.warn("Push notification listeners not available:", error);
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (error) {
        console.warn("Error removing notification subscriptions:", error);
      }
    };
  }, []);
  if (!fontsLoaded) return null;
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PaperProvider>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <PushTokenRegistrar />
                <AppDataInitializer />
                <SelectionProvider>
                  <AlbumCreationProvider>
                    <RootStackNavigator />
                  </AlbumCreationProvider>
                </SelectionProvider>
              </PersistGate>
            </Provider>
          </PaperProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
