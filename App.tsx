import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import React, { useEffect, useState } from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import { PaperProvider } from "react-native-paper";
import * as Font from "expo-font";
import { Provider } from "react-redux";
import { store, persistor } from "./src/store/store";
import { PersistGate } from "redux-persist/integration/react";
import { SelectionProvider } from "./src/contexts/SelectionContext";
import RootStackNavigator from "src/navigation/RootStackNavigator";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Agbalumo: require("./assets/fonts/Agbalumo-Regular.ttf"),
      "Montserrat-Medium": require("./assets/fonts/Montserrat-Medium.ttf"),
      "Montserrat-SemiBold": require("./assets/fonts/Montserrat-SemiBold.ttf"),
      "Gwendolyn-Regular": require("./assets/fonts/Gwendolyn-Regular.ttf"),
      // ...các font khác
    }).then(() => setFontsLoaded(true));
  }, []);
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
              <SelectionProvider>
                <RootStackNavigator />
              </SelectionProvider>
            </PersistGate>
          </Provider>
        </PaperProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
