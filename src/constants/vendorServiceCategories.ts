/**
 * Danh mục dịch vụ — dùng chung: hồ sơ vendor, khuyến mãi, admin.
 * `full` phải khớp chuỗi lưu trong Firestore `vendors.category`.
 * `short` hiển thị gọn trên chip / màn khuyến mãi.
 * `id` là slug, lưu trong `promotions.category` và doc `promotionCategories/{id}`.
 */
export type VendorServiceCategoryDef = {
  id: string;
  full: string;
  short: string;
};

export const VENDOR_SERVICE_CATEGORIES: VendorServiceCategoryDef[] = [
  { id: "planner", full: "Wedding Planner (Tổ chức/Điều phối)", short: "Planner" },
  { id: "venue", full: "Địa điểm & Tiệc cưới", short: "Tiệc cưới" },
  { id: "decor", full: "Trang trí & Decor", short: "Decor" },
  { id: "photo", full: "Chụp ảnh cưới", short: "Chụp ảnh" },
  { id: "video", full: "Quay phim/Phóng sự cưới", short: "Quay phim" },
  { id: "makeup", full: "Trang điểm & Làm tóc", short: "Makeup" },
  { id: "wedding-dress", full: "Áo cưới/Váy cưới", short: "Váy cưới" },
  { id: "groom-suit", full: "Vest chú rể", short: "Vest CR" },
  { id: "wedding-rings-jewelry", full: "Nhẫn cưới - Trang sức", short: "Nhẫn/TS" },
  { id: "flowers", full: "Hoa cưới", short: "Hoa cưới" },
  { id: "invitation", full: "Thiệp cưới", short: "Thiệp" },
  { id: "wedding-car", full: "Xe hoa", short: "Xe hoa" },
  { id: "mc-band", full: "MC & Ban nhạc", short: "MC/Nhạc" },
  { id: "tray-gift", full: "Mâm quả/Tráp cưới", short: "Mâm quả" },
  { id: "wedding-cake", full: "Bánh cưới", short: "Bánh cưới" },
  { id: "sound-light", full: "Âm thanh & Ánh sáng", short: "Âm/Ánh sáng" },
  { id: "photobooth", full: "Backdrop & Photobooth", short: "Photobooth" },
];

export const VENDOR_CATEGORY_FULL_LIST = VENDOR_SERVICE_CATEGORIES.map(
  (c) => c.full
);

/** Map slug cũ (enum 4 giá trị) → id mới */
export const LEGACY_PROMOTION_CATEGORY_MAP: Record<string, string> = {
  studio: "photo",
  makeup: "makeup",
  ring: "wedding-rings-jewelry",
  dress: "wedding-dress",
};

export function normalizePromotionCategoryId(raw?: string): string {
  if (!raw || typeof raw !== "string") return "photo";
  const t = raw.trim();
  if (LEGACY_PROMOTION_CATEGORY_MAP[t]) {
    return LEGACY_PROMOTION_CATEGORY_MAP[t];
  }
  if (VENDOR_SERVICE_CATEGORIES.some((c) => c.id === t)) return t;
  return "photo";
}

export function categoryIdToFull(id: string): string {
  return (
    VENDOR_SERVICE_CATEGORIES.find((c) => c.id === id)?.full ?? id
  );
}

export function categoryFullToId(full: string): string | null {
  const hit = VENDOR_SERVICE_CATEGORIES.find((c) => c.full === full);
  return hit?.id ?? null;
}
