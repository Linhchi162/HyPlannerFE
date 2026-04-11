import { useEffect, useRef, useState } from "react";
import { subscribePendingJoinRequests } from "../service/weddingJoinRequestFirestore";
import { showNotification } from "../utils/pushNotification";

export function usePendingJoinRequestsCount(
  eventId: string | undefined,
  opts?: { notifyOnNew?: boolean }
) {
  const notifyOnNew = opts?.notifyOnNew ?? true;
  const [count, setCount] = useState(0);
  const primed = useRef(false);
  const prev = useRef(0);

  useEffect(() => {
    if (!eventId) {
      setCount(0);
      return;
    }
    primed.current = false;
    const unsub = subscribePendingJoinRequests(eventId, (items) => {
      setCount(items.length);
      if (!primed.current) {
        primed.current = true;
        prev.current = items.length;
        return;
      }
      if (notifyOnNew && items.length > prev.current) {
        const delta = items.length - prev.current;
        void showNotification(
          "HyPlanner",
          delta === 1
            ? "Có 1 yêu cầu tham gia kế hoạch cưới chờ bạn duyệt."
            : `Có ${delta} yêu cầu tham gia mới chờ duyệt.`
        );
      }
      prev.current = items.length;
    });
    return unsub;
  }, [eventId, notifyOnNew]);

  return count;
}
