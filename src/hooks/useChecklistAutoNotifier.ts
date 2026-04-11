import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { selectCurrentUser } from "../store/authSlice";
import { getAccountLimits } from "../utils/accountLimits";
import {
  alertsSignature,
  evaluateChecklistAutoAlerts,
  recordChecklistNotification,
  shouldEmitChecklistNotification,
} from "../utils/checklistAutoAlerts";
import { showNotification } from "../utils/pushNotification";
import { MixpanelService } from "../service/mixpanelService";

const DEBOUNCE_MS = 2500;

/**
 * Tự động gửi thông báo local khi checklist có rủi ro (quá hạn, sắp hết hạn, lệch phụ thuộc giai đoạn…).
 * Chỉ cho tài khoản có canAccessChecklistAi (VIP/PRO). Rule-based (không gọi Gemini mỗi lần) để ổn định & tiết kiệm.
 */
export function useChecklistAutoNotifier() {
  const user = useSelector(selectCurrentUser);
  const phases = useSelector(
    (state: RootState) => state.phases.getPhases.phases
  );
  const weddingEvent = useSelector(
    (state: RootState) => state.weddingEvent.getWeddingEvent.weddingEvent
  );
  const eventId = weddingEvent?._id;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || !eventId) return;

    const limits = getAccountLimits(user.accountType);
    if (!limits.canAccessChecklistAi) return;

    if (!phases?.length) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const alerts = evaluateChecklistAutoAlerts(
        phases,
        weddingEvent?.timeToMarried
      );
      if (alerts.length === 0) return;

      const signature = alertsSignature(alerts);

      const ok = await shouldEmitChecklistNotification({
        eventId,
        signature,
        getItem: (k) => AsyncStorage.getItem(k),
        setItem: (k, v) => AsyncStorage.setItem(k, v),
      });
      if (!ok) return;

      const title = "Checklist cưới: cần chú ý";
      const body =
        alerts.length === 1
          ? alerts[0].body
          : `${alerts[0].body} (và ${alerts.length - 1} cảnh báo khác — xem trong Thông báo trên Trang chủ).`;

      const shortBody =
        body.length > 180 ? `${body.slice(0, 177)}…` : body;

      try {
        await showNotification(title, shortBody, {
          type: "checklist_auto",
          eventId,
          alertKeys: alerts.map((a) => a.key),
        });
        await recordChecklistNotification({
          eventId,
          signature,
          getItem: (k) => AsyncStorage.getItem(k),
          setItem: (k, v) => AsyncStorage.setItem(k, v),
        });
        MixpanelService.track("Checklist Auto Notification Sent", {
          alertCount: alerts.length,
        });
      } catch {
        /* permission denied hoặc lỗi expo */
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, eventId, phases, weddingEvent?.timeToMarried]);
}

export function ChecklistAutoNotifier() {
  useChecklistAutoNotifier();
  return null;
}
