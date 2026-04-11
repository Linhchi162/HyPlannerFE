/**
 * Collections: `promotions`, `promotionCategories`
 *
 * Firestore Rules — gộp vào rules hiện có:
 *   match /promotions/{promotionId} { ... } // như trước
 *   match /promotionCategories/{id} {
 *     allow read: if true;
 *     allow write: if false; // chỉ Admin SDK (server)
 *   }
 *
 * Indexes: promotions (active+createdAt), (vendorId+createdAt)
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { normalizePromotionCategoryId } from "../constants/vendorServiceCategories";

/** hot = hàng ngang Hot deal; dress = hàng Váy cưới */
export type PromotionSection = "hot" | "dress";

/** `category` = slug trùng `promotionCategories` doc id (vd: photo, makeup) */
export type Promotion = {
  id: string;
  vendorId: string;
  vendorName: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  section: PromotionSection;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
  /** Tuỳ chọn — hiển thị khoảng hiệu lực trên màn đã lưu */
  validFrom?: unknown;
  validTo?: unknown;
};

export type PromotionInput = {
  vendorId: string;
  vendorName: string;
  title: string;
  description?: string;
  imageUrl: string;
  category: string;
  section: PromotionSection;
  active: boolean;
  validFrom?: Date | null;
  validTo?: Date | null;
};

/** Metadata danh mục (admin chỉnh shortName, iconUrl) */
export type PromotionCategoryDoc = {
  id: string;
  fullName: string;
  shortName: string;
  iconUrl: string;
  order: number;
  active: boolean;
};

const promotionsCol = () => collection(db, "promotions");
const categoriesCol = () => collection(db, "promotionCategories");

function normalizePromotionImageUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== "string") return "";
  let value = rawUrl.trim();
  if (!value) return "";
  value = value.replace(/\\/g, "/");

  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("http://") || value.startsWith("https://")) {
    const base = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
    if (!base) return value;
    try {
      const target = new URL(value);
      if (target.hostname === "localhost" || target.hostname === "127.0.0.1") {
        const b = new URL(base);
        target.protocol = b.protocol;
        target.hostname = b.hostname;
        target.port = b.port;
        return target.toString();
      }
      return value;
    } catch {
      return value;
    }
  }

  const base = (process.env.EXPO_PUBLIC_BASE_URL || "").trim();
  if (!base) return value;
  try {
    const b = new URL(base);
    const path = value.startsWith("/") ? value : `/${value}`;
    return `${b.origin}${path}`;
  } catch {
    return value;
  }
}

function mapPromotionDoc(
  d: { id: string; data: () => Record<string, unknown> }
): Promotion {
  const raw = d.data() as Omit<Promotion, "id">;
  return {
    id: d.id,
    ...raw,
    imageUrl: normalizePromotionImageUrl(raw.imageUrl),
    category: normalizePromotionCategoryId(raw.category as string),
  };
}

function firestoreLikeToDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  const t = v as { toDate?: () => Date; seconds?: number };
  if (typeof t.toDate === "function") return t.toDate();
  if (typeof t.seconds === "number") return new Date(t.seconds * 1000);
  return null;
}

function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Chuỗi hiển thị dưới tiêu đề ưu đãi (màn đã lưu, v.v.) */
export function formatPromotionValidityHint(p: Promotion): string {
  const from = firestoreLikeToDate(p.validFrom);
  const to = firestoreLikeToDate(p.validTo);
  if (from && to) return `${formatDMY(from)} - ${formatDMY(to)}`;
  if (from) return `Từ ${formatDMY(from)}`;
  const c = firestoreLikeToDate(p.createdAt);
  if (c) return `Đăng ${formatDMY(c)}`;
  return "Đang áp dụng";
}

/** In ra Metro — debug Firestore / index / quyền */
export function logPromotionError(scope: string, err: unknown): void {
  const e = err as {
    code?: string;
    message?: string;
    stack?: string;
    toString?: () => string;
  };
  const code = e?.code;
  const msg =
    e?.message ??
    (typeof e?.toString === "function" ? e.toString() : String(err));
  console.error(
    `[HyPlanner promotions · ${scope}]`,
    code ? `code=${code}` : "",
    msg
  );
  if (e?.stack) console.error(e.stack);
}

export const subscribeActivePromotions = (
  callback: (items: Promotion[]) => void
) => {
  const q = query(
    promotionsCol(),
    where("active", "==", true),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((docSnap) => mapPromotionDoc(docSnap)));
    },
    (error) => {
      logPromotionError("subscribeActivePromotions (màn Ưu đãi)", error);
      callback([]);
    }
  );
};

export const subscribeVendorPromotions = (
  vendorId: string,
  callback: (items: Promotion[]) => void
) => {
  const q = query(
    promotionsCol(),
    where("vendorId", "==", vendorId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((docSnap) => mapPromotionDoc(docSnap)));
    },
    (error) => {
      logPromotionError("subscribeVendorPromotions (kênh vendor)", error);
      callback([]);
    }
  );
};

/** Danh mục hiển thị (đọc public). Admin cập nhật qua HyPlannerBE. */
export const subscribePromotionCategories = (
  callback: (items: PromotionCategoryDoc[]) => void
) => {
  const q = query(categoriesCol(), orderBy("order", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<PromotionCategoryDoc, "id">),
        }))
      );
    },
    (error) => {
      logPromotionError("subscribePromotionCategories", error);
      callback([]);
    }
  );
};

export const createPromotion = async (input: PromotionInput) => {
  try {
    const ref = await addDoc(promotionsCol(), {
      ...input,
      category: normalizePromotionCategoryId(input.category),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  } catch (e) {
    logPromotionError("createPromotion", e);
    throw e;
  }
};

export const updatePromotion = async (
  id: string,
  patch: Partial<PromotionInput>
) => {
  try {
    const next = { ...patch };
    if (next.category != null) {
      next.category = normalizePromotionCategoryId(next.category);
    }
    await updateDoc(doc(db, "promotions", id), {
      ...next,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    logPromotionError(`updatePromotion(${id})`, e);
    throw e;
  }
};

export const deletePromotion = async (id: string) => {
  try {
    await deleteDoc(doc(db, "promotions", id));
  } catch (e) {
    logPromotionError(`deletePromotion(${id})`, e);
    throw e;
  }
};

export const setPromotionImageUrl = async (id: string, imageUrl: string) => {
  try {
    await updateDoc(doc(db, "promotions", id), {
      imageUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    logPromotionError(`setPromotionImageUrl(${id})`, e);
    throw e;
  }
};

export const getPromotion = async (id: string): Promise<Promotion | null> => {
  try {
    const snap = await getDoc(doc(db, "promotions", id));
    if (!snap.exists()) return null;
    return mapPromotionDoc(snap);
  } catch (e) {
    logPromotionError(`getPromotion(${id})`, e);
    throw e;
  }
};
