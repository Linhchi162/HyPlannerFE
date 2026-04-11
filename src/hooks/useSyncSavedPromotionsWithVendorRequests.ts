import { useEffect, useRef } from "react";
import { subscribeUserVendorRequests } from "../service/vendorService";
import { markPromotionUsed } from "../service/savedPromotionsService";

/**
 * Khi vendor đánh dấu đơn dịch vụ hoàn thành và đơn có promotionId,
 * chuyển ưu đãi tương ứng trong danh sách đã lưu sang "đã dùng".
 */
export function useSyncSavedPromotionsWithVendorRequests(
  userIds: string[] | undefined
): void {
  const syncedRequestIds = useRef<Set<string>>(new Set());
  const idsKey = (userIds || []).join("|");

  useEffect(() => {
    const ids = Array.from(
      new Set(
        (userIds || [])
          .map((x) => (typeof x === "string" ? x.trim() : ""))
          .filter((x) => x.length > 0)
      )
    );
    if (ids.length === 0) return;
    syncedRequestIds.current = new Set();
    const unsubs = ids.map((uid) =>
      subscribeUserVendorRequests(uid, (requests) => {
        for (const r of requests) {
          if (r.status !== "done" || !r.promotionId) continue;
          if (syncedRequestIds.current.has(r.id)) continue;
          syncedRequestIds.current.add(r.id);
          void markPromotionUsed(r.promotionId, true);
        }
      })
    );
    return () => {
      syncedRequestIds.current.clear();
      unsubs.forEach((fn) => fn());
    };
  }, [idsKey]);
}
