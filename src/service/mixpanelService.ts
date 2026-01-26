// src/services/mixpanelService.ts
import { Mixpanel } from "mixpanel-react-native";
import logger from "../utils/logger";

// 1. Lấy token và kiểm tra (đảm bảo file .env có EXPO_PUBLIC_MIXPANEL_TOKEN)
const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;
const hasValidToken = typeof token === "string" && token.trim().length > 0;

if (!hasValidToken) {
  logger.error(
    "LỖI MIXPANEL: Không tìm thấy EXPO_PUBLIC_MIXPANEL_TOKEN. Mixpanel sẽ không hoạt động."
  );
}

// 2. Khởi tạo Mixpanel (chỉ khởi tạo nếu có token hợp lệ để tránh crash)
let mixpanel: Mixpanel | null = null;
if (hasValidToken) {
  mixpanel = new Mixpanel(token!, true);
  mixpanel.init();
}

export const MixpanelService = {
  identify: (userId: string) => {
    if (mixpanel) mixpanel.identify(userId);
  },

  setUser: (user: {
    fullName?: string;
    email?: string;
    [key: string]: any;
  }) => {
    if (mixpanel) {
      mixpanel.getPeople().set({
        $name: user.fullName,
        $email: user.email,
        "Plan Type": "Free",
      });
    }
  },

  track: (eventName: string, properties: Record<string, any> = {}) => {
    if (mixpanel) mixpanel.track(eventName, properties);
  },

  reset: () => {
    if (mixpanel) mixpanel.reset();
  },

  setPersonProperties: (props: Record<string, any>) => {
    if (mixpanel) mixpanel.getPeople().set(props);
  },
};
