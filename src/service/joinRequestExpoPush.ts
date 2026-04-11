import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import logger from "../utils/logger";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

function isExpoPushToken(t: unknown): t is string {
  return (
    typeof t === "string" &&
    (t.startsWith("ExponentPushToken[") || t.startsWith("ExpoPushToken["))
  );
}

/**
 * Gửi push qua Expo HTTP API (không cần BE).
 * Cần token Expo đã lưu trong Firestore users/{userId}.fcmTokens (mảng).
 * Có thể thất bại nếu Expo thay đổi policy hoặc không có token hợp lệ.
 */
export async function sendExpoPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  const tokens = new Set<string>();
  for (const uid of userIds) {
    if (!uid) continue;
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const raw = snap.data()?.fcmTokens;
      if (!Array.isArray(raw)) continue;
      for (const t of raw) {
        if (isExpoPushToken(t)) tokens.add(t);
      }
    } catch (e) {
      logger.log("joinRequestExpoPush read tokens", e);
    }
  }
  await Promise.all(
    [...tokens].map(async (to) => {
      try {
        const res = await fetch(EXPO_PUSH_URL, {
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          body: JSON.stringify({
            to,
            title,
            body,
            sound: "default",
            priority: "high",
            data: data ?? {},
          }),
        });
        if (!res.ok) {
          const txt = await res.text();
          logger.log("Expo push non-OK", res.status, txt);
        }
      } catch (e) {
        logger.error("Expo push error", e);
      }
    })
  );
}
