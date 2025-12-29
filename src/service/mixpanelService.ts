// src/services/mixpanelService.ts
import { Mixpanel } from "mixpanel-react-native";
import logger from "../utils/logger";

// 1. Lấy token và kiểm tra (đảm bảo file .env có EXPO_PUBLIC_MIXPANEL_TOKEN)
const token = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN;

if (!token) {
  logger.error(
    "LỖI MIXPANEL: Không tìm thấy EXPO_PUBLIC_MIXPANEL_TOKEN. Mixpanel sẽ không hoạt động."
  );
}

// ---- 🚀 SỬA LỖI TS(2554) TẠI ĐÂY ----
const mixpanel = new Mixpanel(token || "", true);
// ------------------------------------

// 3. Khởi tạo
mixpanel.init();

export const MixpanelService = {
  identify: (userId: string) => {
    mixpanel.identify(userId);
  },

  setUser: (user: {
    fullName?: string;
    email?: string;
    [key: string]: any;
  }) => {
    mixpanel.getPeople().set({
      $name: user.fullName,
      $email: user.email,
      "Plan Type": "Free",
    });
  },

  track: (eventName: string, properties: Record<string, any> = {}) => {
    mixpanel.track(eventName, properties);
  },

  reset: () => {
    mixpanel.reset();
  },

  setPersonProperties: (props: Record<string, any>) => {
    mixpanel.getPeople().set(props);
  },
};
