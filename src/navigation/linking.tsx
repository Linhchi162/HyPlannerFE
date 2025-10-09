// src/navigation/linking.tsx

import { type LinkingOptions } from "@react-navigation/native";
import { RootStackParamList } from "./types";

const scheme = process.env.EXPO_PUBLIC_SCHEME;

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${scheme}://`],
  config: {
    screens: {
      Login: "auth",
      PaymentSuccess: "payment-success",
      PaymentCancelled: "payment-cancelled",
      UpgradeAccountScreen: "upgrade-account",
    },
  },
};
